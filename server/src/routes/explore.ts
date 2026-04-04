import { Prisma } from "@prisma/client";
import { Request, Response, Router } from "express";
import { prisma } from "../config/database";
import { exploreQuerySchema } from "../lib/querySchemas";
import { stripControlChars } from "../lib/sanitize";
import { VERIFIED_VEHICLES } from "../lib/vehicles";

export const exploreRouter = Router();

// GET /api/explore — public browse of all shared configs with search + filter + sort + pagination
exploreRouter.get("/", async (req: Request, res: Response): Promise<void> => {
  const parsed = exploreQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({
      error: "Invalid query parameters",
      details: parsed.error.flatten(),
    });
    return;
  }

  const {
    q: rawQ,
    make: rawMake,
    model: rawModel,
    year,
    tags,
    category: rawCategory,
    sort,
    page,
    limit,
    spVersion,
  } = parsed.data;

  // Strip control characters from free-text search inputs
  const q = rawQ ? stripControlChars(rawQ) : undefined;
  const make = rawMake ? stripControlChars(rawMake) : undefined;
  const model = rawModel ? stripControlChars(rawModel) : undefined;
  const category = rawCategory ? stripControlChars(rawCategory) : undefined;

  try {
    const take = limit;
    const skip = (page - 1) * take;

    const searchFilters: Prisma.ConfigurationWhereInput[] = [];

    if (q && q.trim()) {
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
    if (year) searchFilters.push({ vehicleYear: year });
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

    // SP version filter — matches configs whose metadata.sunnypilotVersion
    // is exactly equal to the requested version string.
    if (spVersion) {
      searchFilters.push({
        config: { path: ["metadata", "sunnypilotVersion"], equals: spVersion },
      });
    }

    const where = {
      isShared: true,
      ...(searchFilters.length > 0 ? { AND: searchFilters } : {}),
    };

    // Determine DB-level orderBy for non-rating/trending sorts
    const isSortedInJS = sort === "rating" || sort === "trending";
    const dbOrderBy =
      sort === "recent"
        ? { sharedAt: "desc" as const }
        : sort === "views"
          ? { viewCount: "desc" as const }
          : sort === "clones"
            ? { cloneCount: "desc" as const }
            : sort === "comments"
              ? { comments: { _count: "desc" as const } }
              : { sharedAt: "desc" as const }; // rating/trending sort done in JS

    const [total, configs] = await Promise.all([
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
          config: true,
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
          ratings: { select: { value: true, createdAt: true } },
          clones: { select: { createdAt: true } },
          _count: { select: { comments: true } },
        },
        take: isSortedInJS ? undefined : take,
        skip: isSortedInJS ? 0 : skip,
        orderBy: dbOrderBy,
      }),
    ]);

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Compute avg rating and trending score per config
    let result = configs.map((c) => {
      const sum = c.ratings.reduce(
        (s: number, r: { value: number }) => s + r.value,
        0,
      );
      const avgRating = c.ratings.length > 0 ? sum / c.ratings.length : null;
      // Trending: recent ratings * 5 + recent clones * 3 + log(viewCount+1)
      const ratings7d = c.ratings.filter(
        (r: { createdAt: Date }) => r.createdAt >= sevenDaysAgo,
      ).length;
      const clones7d = c.clones.filter(
        (cl: { createdAt: Date }) => cl.createdAt >= sevenDaysAgo,
      ).length;
      const trendingScore =
        ratings7d * 5 + clones7d * 3 + Math.log(c.viewCount + 1);
      return {
        ...c,
        ratings: undefined,
        clones: undefined,
        avgRating,
        ratingCount: c.ratings.length,
        commentCount: c._count.comments,
        trendingScore,
        _count: undefined,
      };
    });

    // Apply JS-side sorts (rating, trending)
    if (sort === "rating") {
      result.sort((a, b) => {
        const ra = a.avgRating ?? 0;
        const rb = b.avgRating ?? 0;
        if (rb !== ra) return rb - ra;
        return b.ratingCount - a.ratingCount;
      });
      result = result.slice(skip, skip + take);
    } else if (sort === "trending") {
      result.sort((a, b) => b.trendingScore - a.trendingScore);
      result = result.slice(skip, skip + take);
    }

    // Strip trendingScore from public response
    const publicResult = result.map(({ trendingScore: _, ...r }) => r);

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
      configs: publicResult,
      total,
      page,
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
      const [
        configCount,
        ratingCount,
        commentCount,
        viewsAgg,
        clonesAgg,
        makeGroups,
        categoryGroups,
        tagDocs,
      ] = await Promise.all([
        prisma.configuration.count({ where: { isShared: true } }),
        prisma.rating.count(),
        prisma.comment.count(),
        prisma.configuration.aggregate({
          where: { isShared: true },
          _sum: { viewCount: true },
        }),
        prisma.configuration.aggregate({
          where: { isShared: true },
          _sum: { cloneCount: true },
        }),
        prisma.configuration.groupBy({
          by: ["vehicleMake"],
          where: { isShared: true, vehicleMake: { not: null } },
          _count: { vehicleMake: true },
          orderBy: { _count: { vehicleMake: "desc" } },
          take: 10,
        }),
        prisma.configuration.groupBy({
          by: ["category"],
          where: { isShared: true, category: { not: null } },
          _count: { category: true },
          orderBy: { _count: { category: "desc" } },
          take: 10,
        }),
        prisma.configuration.findMany({
          where: { isShared: true },
          select: { tags: true },
        }),
      ]);

      // Aggregate tag counts across all shared configs
      const tagCounts: Record<string, number> = {};
      for (const doc of tagDocs) {
        for (const tag of doc.tags) {
          tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
        }
      }
      const topTags = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)
        .map(([tag, count]) => ({ tag, count }));

      res.json({
        sharedConfigs: configCount,
        totalRatings: ratingCount,
        totalComments: commentCount,
        supportedMakes: makeGroups.length,
        totalViews: viewsAgg._sum.viewCount ?? 0,
        totalClones: clonesAgg._sum.cloneCount ?? 0,
        topMakes: makeGroups.map((m) => ({
          make: m.vehicleMake!,
          count: m._count.vehicleMake,
        })),
        topCategories: categoryGroups.map((c) => ({
          category: c.category!,
          count: c._count.category,
        })),
        topTags,
      });
    } catch {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  },
);

// GET /api/explore/vehicles — returns the curated verified vehicle list
exploreRouter.get("/vehicles", (_req: Request, res: Response): void => {
  res.json(VERIFIED_VEHICLES);
});
