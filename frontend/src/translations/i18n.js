import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./en";
import hi from "./hi";
import mr from "./mr";
import fr from "./fr";
import de from "./de";
import es from "./es";


i18n
    .use(initReactI18next)
    .init({

        resources: {
            en: {
                translation: en
            },

            hi: {
                translation: hi
            },

            mr: {
                translation: mr
            },

            fr: {
                translation: fr
            },

            de: {
                translation: de
            },

            es: {
                translation: es
            }
        },

        lng: "en",

        fallbackLng: "en",

        interpolation: {
            escapeValue: false
        }

    });


export default i18n;