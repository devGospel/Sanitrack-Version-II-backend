import mongoose from "mongoose";
import app from "../../../index"
import request from "supertest"
import {faker} from "@faker-js/faker"
import { MONGODB_URI } from "../../../constant/dburl";
import User from "../../../models/user";
import { inActiveUser } from "../../constants/users";
import { Logger } from "../../../utils/logger";

const userDetails = { 
    email: "managermain@gmail.com", 
    password: "manager"
}

describe('POST /api/login', () => {
    beforeAll(async () => {

        await mongoose.connect(MONGODB_URI, { 
            connectTimeoutMS: 10000
        })
        mongoose.connection.on('connected', () => console.log('connected'));
    }, 15000)

    afterAll(async () => { 
        await mongoose.connection.close()
    })

    it('should return incorrect credentials for invalid user', async() => { 
        const invalidUserDetails = { email: "invalid@example.com", password: "invalidpassword" };
        const response = await request(app)
            .post('/api/login')
            .send(invalidUserDetails)
            .expect(400);
  
        expect(response.body.message).toBe('Incorrect credentials');
    }, 15000);

    it('should return tell inactive user that they cannot login and they are fired', async () => {

        const response = await request(app)
            .post('/api/login')
            .send({ email: "shortbaddie@orion.tech", password: "bella" })
            expect(response.body.message).toBe('Cannot Login, you are fired');
    }, 15000);

    it('should return required role selection as true to the user because of multiple roles', async() => { 
        const response = await request(app)
        .post('/api/login')
        .send({email: 'ife@testing.com', password: 'ife'})
        .expect(200)

        expect(response.body.data.requiredRoleSelection).toBe(true)
    }, 15000 )
    
    it('should return userData and login token', async () => { 
        const response = await request(app)
        .post('/api/login')
        .send({email: "inspector@gmail.com", password: "inspector" })
        .expect(200)

        // Logger.info(JSON.stringify(response.body.data))
        expect(response.body.data.requiredRoleSelection).toBe(false)
        expect(response.body.message).toBe('Login successful')
    }, 15000)
})