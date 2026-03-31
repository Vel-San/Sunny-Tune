import { Prisma } from "@prisma/client";
import { Request, Response, Router } from "express";
import { prisma } from "../config/database";

export const exploreRouter = Router();

// GET /api/explore — public browse of all shared configs with search + filter + sort + pagination
exploreRouter.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      q,
      make,
      model,
      year,
      tags, // comma-separated
      category,
      sort = "rating",
      page = "1",
      limit = "20",
    } = req.query as Record<string, string>;

    const take = Math.min(50, parseInt(limit) || 20);
    const skip = (Math.max(1, parseInt(page) || 1) - 1) * take;

    const searchFilters: Prisma.ConfigurationWhereInput[] = [];

    if (q && typeof q === "string" && q.trim()) {
      const term = q.trim();
      searchFilters.push({
        OR: [
          { name: { contains: term, mode: "insensitive" } },
          { description: { contains: term, mode: "insensitive" } },
          { vehicleMake: { contains: term, mode: "insensitive" } },
          { vehicleModel: { contains: term, mode: "insensitive" } },
          { tags: { has: term } },
          { category: { contains: term, mode: "insensitive" } },
        ],
      });
    }

    if (make)
      searchFilters.push({
        vehicleMake: { equals: make, mode: "insensitive" },
      });
    if (model)
      searchFilters.push({
        vehicleModel: { contains: model, mode: "insensitive" },
      });
    if (year) searchFilters.push({ vehicleYear: parseInt(year) });
    if (tags) {
      const tagList = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      if (tagList.length > 0)
        searchFilters.push({ tags: { hasEvery: tagList } });
    }
    if (category)
      searchFilters.push({
        category: { equals: category, mode: "insensitive" },
      });

    const where: Prisma.ConfigurationWhereInput = {
      isShared: true,
      ...(searchFilters.length > 0 ? { AND: searchFilters } : {}),
    };

    // Determine DB-level orderBy for non-rating sorts
    const dbOrderBy: Prisma.ConfigurationOrderByWithRelationInput =
      sort === "recent"
        ? { sharedAt: "desc" }
        : sort === "views"
          ? { viewCount: "desc" }
          : sort === "clones"
            ? { cloneCount: "desc" }
            : sort === "comments"
              ? { comments: { _count: "desc" } }
              : { sharedAt: "desc" }; // rating sort done in JS

    const [total, configs] = await prisma.$transaction([
      prisma.configuration.count({ where }),
      prisma.configuration.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          vehicleMake: true,
          vehicleModel: true,
          vehicleYear: true,
          tags: true,
          category: true,
          isShared: true,
          shareToken: true,
          sharedAt: true,
          viewCount: true,
          cloneCount: true,
          clonedFromId: true,
          clonedFrom: { select: { id: true, name: true, shareToken: true } },
          createdAt: true,
          updatedAt: true,
          ratings: { select: { value: true } },
          _count: { select: { comments: true } },
        },
        take: sort === "rating" ? undefined : take, // fetch all when rating-sorting in JS
        skip: sort === "rating" ? 0 : skip,
        orderBy: dbOrderBy,
      }),
    ]);

    // Compute avg rating per config
    let result = configs.map((c) => {
      const sum = c.ratings.reduce((s, r) => s + r.value, 0);
      const avgRating = c.ratings.length > 0 ? sum / c.ratings.length : null;
      return {
        ...c,
        ratings: undefined,
        avgRating,
        ratingCount: c.ratings.length,
        commentCount: c._count.comments,
        _count: undefined,
      };
    });

    // Apply rating sort in JS (weighted: avg descending, tie-break on count)
    if (sort === "rating") {
      result.sort((a, b) => {
        const ra = a.avgRating ?? 0;
        const rb = b.avgRating ?? 0;
        if (rb !== ra) return rb - ra;
        return b.ratingCount - a.ratingCount;
      });
      result = result.slice(skip, skip + take);
    }

    // Facets: distinct tags and makes for filter UI
    const [tagFacets, makeFacets] = await Promise.all([
      prisma.configuration.findMany({
        where: { isShared: true },
        select: { tags: true },
      }),
      prisma.configuration.groupBy({
        by: ["vehicleMake"],
        where: { isShared: true, vehicleMake: { not: null } },
        _count: { vehicleMake: true },
        orderBy: { _count: { vehicleMake: "desc" } },
      }),
    ]);

    const allTags = tagFacets.flatMap((c) => c.tags);
    const tagCounts: Record<string, number> = {};
    for (const t of allTags) {
      tagCounts[t] = (tagCounts[t] ?? 0) + 1;
    }
    const topTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30)
      .map(([tag, count]) => ({ tag, count }));

    const makes = makeFacets.map((m) => ({
      make: m.vehicleMake,
      count: m._count.vehicleMake,
    }));

    res.json({
      configs: result,
      total,
      page: parseInt(page) || 1,
      limit: take,
      facets: { tags: topTags, makes },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch explore data" });
  }
});

// GET /api/explore/stats — high-level community stats
exploreRouter.get(
  "/stats",
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const [configCount, ratingCount, commentCount, makeCount] =
        await prisma.$transaction([
          prisma.configuration.count({ where: { isShared: true } }),
          prisma.rating.count(),
          prisma.comment.count(),
          prisma.configuration.groupBy({
            by: ["vehicleMake"],
            where: { isShared: true, vehicleMake: { not: null } },
            orderBy: { _count: { vehicleMake: "desc" } },
            _count: { vehicleMake: true },
          }),
        ]);
      res.json({
        sharedConfigs: configCount,
        totalRatings: ratingCount,
        totalComments: commentCount,
        supportedMakes: makeCount.length,
      });
    } catch {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  },
);
