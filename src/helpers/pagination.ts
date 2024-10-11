import { MongoosePaginationOptions } from "@/types/paginationOptions";

export const getMongoosePaginationOptions = ({
  page = 1,
  limit = 20,
  customLabels,
}: MongoosePaginationOptions) => {
  return {
    page: Math.max(page, 1),
    limit: Math.max(limit, 1),
    pagination: true,
    customLables: {
      pagingCounter: "serialNumberStartFrom",
      ...customLabels,
    },
  };
};
