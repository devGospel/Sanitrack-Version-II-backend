import {calculateNextDate} from "../../utils/frequency"

describe('Calculate Next Date', () => { 
    it('should return the next date for daily repeat', () => { 
        const scheduled_date = new Date('2024-04-02')
        const nextDate = calculateNextDate(scheduled_date, 'daily')
        expect(nextDate).toEqual(new Date('2024-04-03'))
    })

    it('should return the next date for weekly repeat', () => { 
        const scheduled_date = new Date('2024-04-03')
        const nextDate = calculateNextDate(scheduled_date, 'weekly')
        expect(nextDate).toEqual(new Date('2024-04-10'))
    })

    it('should return the next date for monthly repeat', () => { 
        const scheduled_date = new Date('2024-04-03')
        const nextDate = calculateNextDate(scheduled_date, 'monthly')
        expect(nextDate).toEqual(new Date('2024-05-03'))
    })

    it('should return the correct last date when the last day of the month is passed', () => { 
        const scheduled_date = new Date('2024-04-30')
        const nextDate = calculateNextDate(scheduled_date, 'daily')
        expect(nextDate).toEqual(new Date('2024-05-01'))
    })

    it('should throw an error for an invalid repeat value', () => {
        const scheduledDate = new Date('2024-04-02');
        expect(() => {
            calculateNextDate(scheduledDate, 'hi');
        }).toThrow('Invalid repeat value');
    });
    
    it('should throw an error if an invalid date is passed for scheduled_date and invalid string for repeat value', () => { 
        expect(() => { 
            calculateNextDate("hi" as any, 1 as any)
        }).toThrow('Invalid type passed for either repeat Value or scheduled date')
    })

    it('should throw an error if an invalid date is passed for scheduled date', () => { 
        expect(() => { 
            calculateNextDate('yello' as any, 'weekly')
        }).toThrow('Invalid type passed for either repeat Value or scheduled date')
    })

    it('should throw an error if an invalid repeat value is passed', () => { 
        expect(() => { 
            calculateNextDate(new Date('2024-03-08'), 1 as any)
        }).toThrow('Invalid type passed for either repeat Value or scheduled date')
    }) 
    
})