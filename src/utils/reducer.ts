export const sumArray =  (arr: Number[]) => {

    if (arr.some(item => typeof item === 'string')) {
        throw new Error('Array should only contain numbers');
    }

    return arr.reduce((total, current) => {
        return (total as number) + (current as number);
    }, 0);
}