import app from "../../index"
import request from "supertest"

describe('Welcome Endpoint', () => { 
    it('should return up and running', async()=>{
        const response = await request(app).get("/health")
        expect(response.statusCode).toBe(200)
        expect(response.body.message).toBe("Up and running ^_^")
    })
})