export const calculateNextDate = (scheduled_date: Date, repeatValue: string) => {

    if(typeof repeatValue !== 'string' || !(scheduled_date instanceof Date)){ 
        throw new Error('Invalid type passed for either repeat Value or scheduled date')
    }


    // Check if scheduled_date is out-of-bound
    if (scheduled_date.getDate() > new Date(scheduled_date.getFullYear(), scheduled_date.getMonth() + 1, 0).getDate()) {
        throw new Error('Invalid scheduled_date: scheduled_date must be a valid date');
    }
    
    // Parse today's date
    const todayDate = new Date(scheduled_date);
    todayDate.setHours(0,0,0,0)
    // Initialize nextDate as today's datea
    let nextDate = new Date(todayDate);

    // Switch statement to handle different repeat values
    switch (repeatValue.toLowerCase()) {
        case 'daily':
            nextDate.setDate(todayDate.getDate() + 1);
            break;
        case 'weekly':
            nextDate.setDate(todayDate.getDate() + 7);
            break;
        case 'monthly':
            nextDate.setMonth(todayDate.getMonth() + 1);
            break;
        case 'yearly':
            nextDate.setFullYear(todayDate.getFullYear() + 1);
            break;
        default:
            throw new Error('Invalid repeat value');
    }

    // Return the next repeat date
    return nextDate;
}
