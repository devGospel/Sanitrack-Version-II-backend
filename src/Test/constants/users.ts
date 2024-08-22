import {faker} from "@faker-js/faker"

export const newUser = {
    username: faker.name.fullName(),
    password: 'hiii',
    email: faker.internet.email(),
    phone_number: faker.phone.number(),
    role_id: '65bbb1e6960a9012fd81f0b9',
    role_name: 'Cleaner',
    address: { country: 'testCountry', state: 'testState', city: 'testCity', home_address: "testHome" }
};

export const inActiveUser = { 
    username: faker.name.fullName(),
    password: 'hiii',
    email: faker.internet.email(),
    address_id: "65e44b730872137740de21be",
    phone_number: faker.phone.number(), 
    flag: "INACTIVE", 
}