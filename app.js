import * as cheerio from "cheerio";
import axios from "axios";
import { Parser } from 'json2csv';
import fs from 'fs';

const ufcURL = "https://www.ufc.com/events";

const mmaEvents = [];

const fields = ['Event', 'Event Date', 'Fights'];
const json2csvParser = new Parser({ fields });
;



function cleanText(text) {
  return text.replace(/\s+/g, " ").trim();
}

async function getUFCCardFightDetails(fightCard) {
  const fightCardResponse = await axios.get(`https://www.ufc.com${fightCard}`);
  const $$ = cheerio.load(fightCardResponse.data);
    const fights = $$(".c-listing-fight__content-row");
    const eventType = cleanText($$(".c-hero__headline-prefix").text());
  const eventFights = [];

  fights.each(function () {
    const fightRedCorner = $$(this).find(".c-listing-fight__corner-name--red");
    const fighterNameRedCorner =
      cleanText($$(this).find(".c-listing-fight__corner-name--red a").text()) ||
      fightRedCorner.find(".c-listing-fight__corner-given-name").text() +
        " " +
        fightRedCorner.find(".c-listing-fight__corner-family-name").text();

    const fightBlueCorner = $$(this).find(
      ".c-listing-fight__corner-name--blue"
    );
    const fighterNameBlueCorner =
      cleanText(
        $$(this).find(".c-listing-fight__corner-name--blue a").text()
      ) ||
      fightBlueCorner.find(".c-listing-fight__corner-given-name").text() +
        " " +
        fightBlueCorner.find(".c-listing-fight__corner-family-name").text();

    eventFights.push(`${fighterNameRedCorner} vs ${fighterNameBlueCorner}`);
  });

  return {eventFights, eventType};
}



async function getUFCEvents() {
  try {
    const response = await axios.get(ufcURL);
    const $ = cheerio.load(response.data);
    const eventList = $("li");
    const events = []; // Array to hold event details with fights

    const eventPromises = eventList
      .map(async function () {
        const eventInfo = $(this);
        const fightCard = eventInfo
          .find(".c-card-event--result__headline a")
          .attr("href");
        const timestamp = eventInfo
          .find(".c-card-event--result__date")
          .attr("data-main-card-timestamp");
        const eventDate = eventInfo
          .find(".c-card-event--result__date")
              .attr("data-main-card");
        const eventText = eventInfo
          .find(".c-card-event--result__headline a")
          .text();

        if (
          timestamp &&
          timestamp > Math.floor(new Date().getTime() / 1000) &&
          eventText !== "TBD vs TBD"
        ) {
          const eventDetails = {
            "Event":  "",
            "Event Date": eventDate.replace(/^(.*?)\s*\/.*/, "$1"),
            Fights: [],
          };

          const {eventFights, eventType} = await getUFCCardFightDetails(fightCard);
            eventDetails["Fights"] = eventFights;
            eventDetails["Event"] = eventType + " " + eventText;

          mmaEvents.push(eventDetails);
        }
      })
      .get(); // .get() converts the Cheerio object to a plain array

    await Promise.all(eventPromises);

    
  } catch (error) {
    console.error(error);
  }
}

getUFCEvents();


// ONE FC Scraper

const oneFCURL = "https://www.onefc.com/events/#upcoming";

async function getOneFCFightDetails(fightCard) {
    const fightCardResponse = await axios.get(fightCard);
    const $$ = cheerio.load(fightCardResponse.data);
    const fights = $$(".event-matchup "); 
    const eventFights = [];

    fights.each(function () {
        const fightRedCorner = $$(this).find(".stats");

        eventFights.push(cleanText(fightRedCorner.find("a").first().text()) + " vs " + cleanText(fightRedCorner.find("a").eq(1).text()));
    })

    return eventFights;
}


async function getOneFCEvents() {
  try {
    const response = await axios.get(oneFCURL);
    const $ = cheerio.load(response.data);
    const eventList = $(".simple-post-card");
    const events = [];

    const eventPromises = eventList
        .map(async function () {
            const eventInfo = $(this);
            const fightCard = eventInfo.find(".title").attr("href");
            const eventDate = eventInfo.find(".day").text();
            const eventText = eventInfo.find(".title h3").text();
            const eventDetails = {
                "Event": eventText,
                "Event Date": cleanText(eventDate),
                'Fights': []
            };

            if (eventDate !== "") {
                const fights = await getOneFCFightDetails(fightCard);
                eventDetails['Fights'] = fights;
                mmaEvents.push(eventDetails);
            }
      })
      .get();

      await Promise.all(eventPromises);
      
    
    const csv = json2csvParser.parse(mmaEvents)
    fs.writeFileSync('mmaEvents.csv', csv, 'utf-8');
  } catch (error) {
    console.error(error);
  }
}

getOneFCEvents();

