import bannerImg from '../assets/images/residenza_vannucci_banner_1786350908007.jpg';
import logoImg from '../assets/images/residenza_vannucci_logo_1786350922951.jpg';

export interface CompanyDetails {
  ragioneSociale: string;
  partitaIva: string;
  codiceFiscale: string;
  vatEuropeo: string;
  indirizzo: string;
  cap: string;
  citta: string;
  provincia: string;
  rea: string;
  pec: string;
  strutturaNome: string;
  telefonoStruttura: string;
  cellulareStruttura: string;
  sitoWeb: string;
  emailInfo: string;
  bannerImage: string;
  logoImage: string;
}

export const COMPANY_INFO: CompanyDetails = {
  ragioneSociale: 'GRUPPO CARIGNANO S.R.L.',
  partitaIva: '01892400993',
  codiceFiscale: '01892400993',
  vatEuropeo: 'IT01892400993',
  indirizzo: 'VIA ATTO VANNUCCI 3/5',
  cap: '16128',
  citta: 'GENOVA',
  provincia: 'GE',
  rea: 'GE - 443525',
  pec: 'residenzavannucci@gigapec.it',
  strutturaNome: 'Residenza Vannucci - Residenza per Anziani (Genova Carignano)',
  telefonoStruttura: '010/5959581',
  cellulareStruttura: '366 2601238',
  sitoWeb: 'www.residenzavannucci.it',
  emailInfo: 'residenzavannucci@gigapec.it',
  bannerImage: bannerImg,
  logoImage: logoImg,
};

