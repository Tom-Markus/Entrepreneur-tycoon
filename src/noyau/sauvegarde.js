// Sauvegarde dans le navigateur (localStorage) : 3 emplacements + les réglages.
import { CONFIG } from '../config.js';

const S = CONFIG.sauvegarde;
const cle = (n) => S.prefixe + 'emplacement_' + n;

export const Sauvegarde = {
  lire(n) { try { const t = localStorage.getItem(cle(n)); return t ? JSON.parse(t) : null; } catch (e) { return null; } },
  ecrire(n, donnees) { try { localStorage.setItem(cle(n), JSON.stringify(donnees)); return true; } catch (e) { return false; } },
  effacer(n) { try { localStorage.removeItem(cle(n)); } catch (e) { /* stockage indisponible */ } },
  /** Résumé de chaque emplacement (null si vide). */
  lister() {
    const liste = [];
    for (let i = 0; i < S.emplacements; i++) { const d = this.lire(i); liste.push(d ? d.resume : null); }
    return liste;
  },
  lireReglages() { try { return JSON.parse(localStorage.getItem(S.prefixe + 'reglages')) || {}; } catch (e) { return {}; } },
  ecrireReglages(r) { try { localStorage.setItem(S.prefixe + 'reglages', JSON.stringify(r)); } catch (e) { /* stockage indisponible */ } },
};
