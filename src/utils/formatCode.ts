// Helper function to format the code
export const formatCode = (number: number | Number) => {
    return number.toString().padStart(3, '0'); //Javascript will treat is as 0 or 1 if it is not converted to string because of the leading zeros
  }