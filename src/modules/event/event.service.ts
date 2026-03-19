
import { Event } from "../../generated/prisma/client";
import { prisma } from "../../lib/prisma";

const createEvent = async(payload:Event) => {
 const result = await prisma.event.create({
    data:payload
 })   
 return result
}

const getAllDoctors = async() => {
    
}


export const EventService = {
    createEvent 
}