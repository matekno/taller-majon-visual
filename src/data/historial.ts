import { TALLERES } from './types'

/**
 * Cómo quedó la división de la etapa 1. El índice de cada lista se corresponde
 * con el de TALLERES, así que el orden importa: si cambian los talleres, hay
 * que revisar esto también (el chequeo de abajo avisa si se desalinean).
 *
 * Los nombres están tal cual se cargaron a mano, con las inconsistencias del
 * caso (apodos, gente sin apellido). El matcheo contra las respuestas nuevas
 * es fuzzy justamente por eso — ver utils/historialMatch.ts.
 */
export const HISTORIAL: string[][] = [
  // Ventas y Hadrajá
  [
    'Nicolas Cukier',
    'Micaela Schilman',
    'More Zalcman',
    'Alan Faj',
    'Thiago Elman',
    'Sebastian Zymerman',
    'Tati Said',
    'Ian Pelzmajer',
    'Delfi Kersz',
    'Micaela Moscovich',
    'Tommy Moed',
    'Gael Fallas',
  ],
  // Ludoteca poco convencional
  [
    'Maga Slavkin',
    'Ethan Cohen',
    'Nikita Said',
    'Noa Bryk',
    'Mica Vugin',
    'Tomas Bembenaste',
    'Luka Navarro',
    'Shirly Golberg',
    'Tali Charas',
    'Carolina Grosser',
    'Dalila Szabo',
    'Juliana La Falce',
    'Clara',
  ],
  // Tecnología dIA a dIA
  [
    'Ivan Luchinsky',
    'Kiara Brukiew',
    'Liam Korach',
    'Zoe Ehrenfreund',
    'Ezequiel Alfie',
    'Eitan Moscovich',
    'Nicolas Schwartz',
    'Manuela Hamuy',
    'Keila Goldszmidt',
    'Paul Waisman',
    'Eitan Sejtman',
    'Gael Saiegh',
  ],
  // Manualidades
  [
    'Micaela Sevilla',
    'Micaela Berman',
    'Martina Tambal',
    'Julian Berjman',
    'Valen Mali',
    'Solana Chab',
    'Solana Szwarcberg',
    'Leandro',
    'Melanie Gun',
    'Jazmin Geldstein',
    'Dalia Goldszmidt',
    'Emma Cracovski',
  ],
  // Actualidad internacional y debate
  [
    'Micaela Pecar',
    'Michal Tesler',
    'Bruno Harari',
    'Sabrina Gordon',
    'Cami Salem',
    'Tobias Chouela',
    'Manuel Kaplan',
    'Tatiana Skliar',
    'Juana',
    'Manuel Volosin',
    'Dylan Waisman',
    'Jere Budman',
    'Jazmin Burguez',
  ],
]

if (HISTORIAL.length !== TALLERES.length) {
  throw new Error(
    `HISTORIAL tiene ${HISTORIAL.length} listas pero hay ${TALLERES.length} talleres`,
  )
}
