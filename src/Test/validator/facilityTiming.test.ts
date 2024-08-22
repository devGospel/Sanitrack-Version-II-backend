import facilityTimingValidationSchema from "../../validator/facilityTiming"

describe('validate facility timing inputs', () => { 
    it('should return valid for valid facility timing object', () => { 
        const data = {
            "facility_id":"65fd34eb4370dc67b8bfd529",
            "assigned_supervisors": ["65e44c5c0872137740de2340"], //hii@test.com
            "scheduled_date": "2024-03-28T05:47:43.428+00:00", 
            "repeat": "Daily",
            "stages": [
                {"name": "clean", "stage_hour": "20", "stage_minute":"30"},
                {"name": "preop", "stage_hour": "21", "stage_minute":"00"},
                {"name": "release", "stage_hour": "22", "stage_minute":"15"}
            ]
        }
        const result = facilityTimingValidationSchema.createFacilityTiming.validate(data)
        expect(result.error).toBeUndefined(); // means that the test passed 
    })

    it('should return facility id is required', () => { 
        const data = {
            "assigned_supervisors": ["65e44c5c0872137740de2340"], //hii@test.com
            "scheduled_date": "2024-03-28T05:47:43.428+00:00", 
            "repeat": "Daily",
            "stages": [
                {"name": "clean", "stage_hour": "20", "stage_minute":"30"},
                {"name": "preop", "stage_hour": "21", "stage_minute":"00"},
                {"name": "release", "stage_hour": "22", "stage_minute":"15"}
            ]
        }
        const result = facilityTimingValidationSchema.createFacilityTiming.validate(data)
        expect(result.error).toBeDefined(); // Expects an error to be defined
        expect(result.error?.details[0].message).toEqual('"Facility id is required" is required');
    })

    it('should return the stage name is required', () => { 
        const data = {
            "facility_id":"65fd34eb4370dc67b8bfd529",
            "assigned_supervisors": ["65e44c5c0872137740de2340"], //hii@test.com
            "scheduled_date": "2024-03-28T05:47:43.428+00:00", 
            "repeat": "Daily",
            "stages": [
                {"stage_hour": "20", "stage_minute":"30"},
                {"name": "preop", "stage_hour": "21", "stage_minute":"00"},
                {"name": "release", "stage_hour": "22", "stage_minute":"15"}
            ]
        }
        const result = facilityTimingValidationSchema.createFacilityTiming.validate(data)
        expect(result.error).toBeDefined()
        expect(result.error?.details[0].message).toEqual('"Stage name is required" is required')
    })

    it('should return scheduled_date is required and must be in ISO format ', () =>{ 
        const data = {
            "facility_id":"65fd34eb4370dc67b8bfd529",
            "assigned_supervisors": ["65e44c5c0872137740de2340"], //hii@test.com
            "scheduled_date": "yello", 
            "repeat": "Daily",
            "stages": [
                {"name": "clean", "stage_hour": "20", "stage_minute":"30"},
                {"name": "preop", "stage_hour": "21", "stage_minute":"00"},
                {"name": "release", "stage_hour": "22", "stage_minute":"15"}
            ]
        }
        const result = facilityTimingValidationSchema.createFacilityTiming.validate(data)
        expect(result.error).toBeDefined()
        expect(result.error?.details[0].message).toEqual('"Scheduled date is required" must be in iso format')
    })
})