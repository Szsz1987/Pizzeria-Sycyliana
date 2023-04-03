import BaseWidget from '../Components/BaseWidget.js';
import utils from '../utils.js';
import {select, settings} from '../settings.js';

class DatePicker extends BaseWidget{
  constructor(wrapper){
    super(wrapper, utils.dateToStr(new Date()));
    const thisWidget = this;
    thisWidget.dom.input = thisWidget.dom.wrapper.querySelector(select.widgets.datePicker.input);
    thisWidget.initPlugin();
  }
  initPlugin(){
    const thisWidget = this;
    thisWidget.minDate = new Date();
    thisWidget.maxDate = utils.addDays(thisWidget.minDate, settings.datePicker.maxDaysInFuture);
    // eslint-disable-next-line no-undef
    flatpickr(thisWidget.dom.input, {
      defaultDate: thisWidget.minDate,
      minDate: thisWidget.minDate,
      maxDate: thisWidget.maxDate,
      locale: {
        firstDayOfWeek: 1
      },
      disable: [ // our restaurant is closed on Mondays. This option will take care of blocking that day
        function(date) {
          return (date.getDay() === 1);
        }
      ],
      onChange: function(selectedDates, dateStr) { // callback function (onChange) it will be run when the plugin detects a change in the term. Note that the result of this function will simply update thisWidget.value
        thisWidget.value = dateStr;
      },
    });
  }
  parseValue(value){
    return value;
  }
  isValid(){
    return true;
  }
  renderValue(){
  }
}

export default DatePicker;