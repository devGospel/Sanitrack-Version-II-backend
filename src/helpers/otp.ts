export const generateOTP = (digits = 4) => {
    let min = 1000;
    let max = 9999;
    let otp = Math.random() * (max - min) + min;
    return Math.trunc(otp).toString();
};