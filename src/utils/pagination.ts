export const paginationBuilder = (page: number, pageSize: number, data: string | any[]) => {
	try {
		page = page ? Number(page) : 1;
		pageSize = pageSize ? Number(pageSize) : 20;
		const total = data.length;
		const totalPages = Math.ceil(data.length / pageSize);
		const start = (page - 1) * pageSize;
		const end = page * pageSize;
		const items = data.length > 0 ? data.slice(start, end) : [];
		return {
			items,
			pageInfo: {
				page,
				pageSize,
				total,
				totalPages,
			},
		};
	} catch (error) {
		throw new Error('pagination error')
	}
};
