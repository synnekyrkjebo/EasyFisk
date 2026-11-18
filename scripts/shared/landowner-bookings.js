import {listLandownerBookings} from './demo-tickets.js';
import {publishLandownerNotice} from './landowner-store.js';

export function bookingsForDay(tickets,place,date){
 return tickets.filter(ticket=>ticket.booking.place.name===place&&ticket.booking.dates.includes(date));
}

export async function sendBookingMessage(place,date,tokens,title,text){
 const bookings=bookingsForDay(await listLandownerBookings(),place,date);
 const selected=[...new Set(tokens)];
 if(!selected.length||selected.some(token=>!bookings.some(ticket=>ticket.token===token)))throw new Error('Velg fiskere med kort på denne fiskeplassen og datoen.');
 const recipients=bookings.filter(ticket=>selected.includes(ticket.token)).map(ticket=>ticket.recipient.email.toLowerCase());
 return publishLandownerNotice(place,title,text,{recipientEmails:recipients,bookingDate:date});
}
