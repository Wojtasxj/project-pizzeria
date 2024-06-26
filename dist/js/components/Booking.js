import {select, templates, settings, classNames} from "./../settings.js";
import {utils} from "./../utils.js";
import AmountWidget from "./AmountWidget.js";
import DatePicker from "./DatePicker.js";
import HourPicker from "./HourPicker.js";

class Booking {
    constructor(element) {
      this.render(element);
      this.initWidgets();
      this.getData();
    }

    getData(){
        const thisBooking = this;
        const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePicker.minDate);
        const endDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePicker.maxDate);

        const params = {
            booking: [
                startDateParam,
                endDateParam,
            ],
            eventsCurrent: [
                settings.db.notRepeatParam,
                startDateParam,
                endDateParam,
            ],
            eventsRepeat:  [
                settings.db.repeatParam,
                endDateParam,
            ],
        };

               
        const urls = {
            booking:        settings.db.url + '/' + settings.db.bookings + '?' + params.booking.join('&'),
            eventsCurrent:  settings.db.url + '/' + settings.db.events   + '?' + params.eventsCurrent.join('&'),
            eventsRepeat:   settings.db.url + '/' + settings.db.events   + '?' + params.eventsRepeat.join('&'),
        };
        Promise.all([
            fetch(urls.booking),
            fetch(urls.eventsCurrent),
            fetch(urls.eventsRepeat),
        ])
        
            .then(function(allResponses) {
                const bookingsResponse = allResponses[0];
                const eventsCurrentResponse = allResponses[1];
                const eventsRepeatResponse = allResponses[2];
                
                return Promise.all([
                bookingsResponse.json(),
                eventsCurrentResponse.json(),
                eventsRepeatResponse.json(),
                ]);
          })
            .then(function([bookings, eventsCurrent, eventsRepeat]){
             // console.log(bookings);
             // console.log(eventsCurrent);
             // console.log(eventsRepeat);
               thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
          });
    }   

    parseData(bookings, eventsCurrent, eventsRepeat){
        const thisBooking = this;

        thisBooking.booked = {};
        for(let item of bookings){
            thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
        }                
        for(let item of eventsCurrent){
            thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
        }
        const minDate = thisBooking.datePicker.minDate;
        
        const maxDate = thisBooking.datePicker.maxDate;

        for(let item of eventsRepeat){
            if(item.repeat == 'daily'){
                for(let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)){
                thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
        }}}
        // console.log('thisBooking.booked', thisBooking.booked);           
            
        thisBooking.updateDOM();
    }

    makeBooked(date, hour, duration, table){
        const thisBooking = this;
        if(typeof thisBooking.booked [date] =='undefined'){
           thisBooking.booked[date] = {}; 
        }

        const startHour = utils.hourToNumber(hour);
        
        

        for(let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5) {
          if(typeof thisBooking.booked [date][hourBlock] =='undefined'){
            thisBooking.booked[date][hourBlock] = [];
            }

            thisBooking.booked[date][hourBlock].push(table);
        
        //  console.log('loop', hourBlock);
        }
    }

    updateDOM(){
        const thisBooking = this;
        thisBooking.date = thisBooking.datePicker.value;
        thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

        let allAvailable = false;

        if(
            typeof thisBooking.booked[thisBooking.date] == 'undefined' &&
            typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined'
          ){
            allAvailable = true;
          }

        for(let table of thisBooking.dom.tables){
            let tableId = table.getAttribute(settings.booking.tableIdAttribute);
            if(!isNaN(tableId)){
               tableId = parseInt(tableId);
            }
            if(
                !allAvailable &&
                thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)
            ){
                table.classList.add(classNames.booking.tableBooked);
            } else {
                table.classList.remove(classNames.booking.tableBooked);
            }
        }
    }
    render(wrapper) {
        const thisBooking = this;
        const generatedHTML = templates.bookingWidget();
        thisBooking.dom = {};
        thisBooking.dom.wrapper = wrapper;
        thisBooking.dom.wrapper.innerHTML = generatedHTML;
        
        thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector(select.booking.peopleAmount);
        thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(select.booking.hoursAmount);
        thisBooking.dom.inputDate = thisBooking.dom.wrapper.querySelector(select.widgets.datePicker.wrapper);
        thisBooking.dom.inputHour = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.wrapper);

        thisBooking.dom.tables = thisBooking.dom.wrapper.querySelector(select.booking.tables);
      }
    
      initWidgets() {
        this.peopleAmountWidget = new AmountWidget(this.dom.peopleAmount);
        this.hoursAmountWidget = new AmountWidget(this.dom.hoursAmount);
        this.datePicker = new DatePicker(this.dom.inputDate);
        this.hourPicker = new HourPicker(this.dom.inputHour);
        this.dom.wrapper.addEventListener('updated', function () {
            this.updateDOM();
        });
      }
}    
export default Booking;