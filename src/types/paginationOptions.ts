interface CustomLabels {
    totalDocs?: string;
    docs?: string;
    pagingCounter?: string;
}

export interface MongoosePaginationOptions {
    page: number;
    limit: number;
    customLabels: CustomLabels;
}