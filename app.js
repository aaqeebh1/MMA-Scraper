import * as cheerio from 'cheerio';
import axios from "axios";


const url = "https://www.ufc.com/events"

const eventFights = []

function cleanText(text) {
  return text.replace(/\s+/g, ' ').trim();
}


async function getEvents() { 
    try { 
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        const headline = cleanText($(".c-hero--full__headline").text());
        const fightCard = cleanText($(".c-hero__actions").find("a").attr("href"));
        
        const fightCardResponse = await axios.get(fightCard);
        const $$ = cheerio.load(fightCardResponse.data);
        const cardStartTime = cleanText($$(".c-event-fight-card-broadcaster__time").text())
        const cardLocation = cleanText($$(".c-hero__text").find(".field").text());
        const fights = $$(".c-listing-fight__content-row");

        fights.each(function () {
            const fightRedCorner = $(this).find(".c-listing-fight__corner-name--red")            
            const fighterNameRedCorner = cleanText($(this).find(".c-listing-fight__corner-name--red").find("a").text()) || fightRedCorner.find(".c-listing-fight__corner-given-name").text() + " " + fightRedCorner.find(".c-listing-fight__corner-family-name").text();
            const fightBlueCorner = $(this).find(".c-listing-fight__corner-name--blue")
            const fighterNameBlueCorner = cleanText($(this).find(".c-listing-fight__corner-name--blue").find("a").text()) || fightBlueCorner.find(".c-listing-fight__corner-given-name").text() + " " + fightBlueCorner.find(".c-listing-fight__corner-family-name").text();
            eventFights.push(`${fighterNameRedCorner} vs ${fighterNameBlueCorner}`)
        });
        
        
        console.log(`${headline}
             ${cardLocation}
              ${cardStartTime}
               `, eventFights)

        
        

    } catch (error) { 

        console.error(error);

    }
}

getEvents();