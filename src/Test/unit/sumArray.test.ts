import {sumArray} from "../../utils/reducer"

describe('sumArray function', () => {

    it('should return the sum of all numbers in the array', () => {
      const arr = [1, 2, 3, 4, 5];
      const result = sumArray(arr);
      expect(result).toBe(15);
    });
  
    it('should return 0 for an empty array', () => {
      const arr: number[] = [];
      const result = sumArray(arr);
      expect(result).toBe(0); 
    });
  
    it('should return the correct sum for arrays with negative numbers', () => {
      const arr = [-1, -2, -3, -4, -5];
      const result = sumArray(arr);
      expect(result).toBe(-15);
    });
  
    it('should return 0 for an array with only one element being 0', () => {
      const arr = [0];
      const result = sumArray(arr);
      expect(result).toBe(0);
    });
  
    it('should return 0 for an array with only one non-numeric string', () => {
        const arr = ['hello'] as any;
        expect(() => {
            sumArray(arr)
        }).toThrow('Array should only contain numbers')
    });
});