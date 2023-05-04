import {templates} from '../settings.js';

class Home{
  constructor(element){
    const thisHome = this;
    thisHome.render(element);
  }

  render(element){
    const thisHome = this;
    thisHome.dom = {}; 
    thisHome.dom.wrapper = element;
    const generatedHTML = templates.homeSite();
    thisHome.dom.wrapper.innerHTML = generatedHTML;
  }
}

export default Home;
