/**
 * Replaces all undefined values in an object with null
 * @param {Object} data 
 * @returns 
 */
export const undefinedConverter = (data:any, replaceValue = null) => {
	let final = {};
	const entities = Object.entries(data);
	for (const [key, value] of entities) {
		if (value === undefined) {
			Object.assign(final, { [key]: replaceValue || null });
		} else {
			Object.assign(final, { [key]: value });
		}
	}
	return final;
};