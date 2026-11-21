/**
 * Identidad Visual Oficial — Los Brownies de Josefina
 * Extraído del manual de identidad de marca (docs/brand/Manual_Identidad_Los_Brownies_de_Josefina.pdf)
 */

export const BRAND_COLORS = {
  // Fondos cálidos
  cream: '#ECEBCF',      // Crema Vainilla principal
  creamLight: '#F7F6EE', // Crema iluminada para tarjetas
  creamDark: '#DEDBB9',  // Crema para bordes suaves

  // Cacao y textos nobles
  chocolate: '#22221E',  // Marrón Chocolate oscuro (logo y títulos)
  chocolateSoft: '#3C3A35', // Texto secundario
  chocolateMuted: '#68655E', // Textos tenues

  // Acentos pastel
  sage: '#B6BD90',       // Verde Salvia / Pistacho (ingredientes y stock anaquel)
  sageLight: '#DCE0CA',  // Verde Salvia suave para fondos de badge
  
  mauve: '#A472B9',      // Rosa Malva (favoritos, afecto, regalos)
  mauveLight: '#E8D5EE', // Rosa Malva suave para fondos de badge
  
  lavender: '#98A1D5',   // Lavanda Pervinca (categorías y modernidad)
  lavenderLight: '#DCE1F7', // Lavanda suave para fondos de badge

  // Neutros puros
  white: '#FFFFFF',
} as const;

export const BRAND_INFO = {
  name: 'Los Brownies de Josefina',
  tagline: 'Repostería & Chocolatería Artesanal',
  slogan: 'ENCUENTRA AQUÍ EL AMOR MÁS DULCE',
} as const;

export type BrandColorName = keyof typeof BRAND_COLORS;
