# Atout France - Extracteur d'Hébergements Classés

## Description

Cet Actor Apify extrait les données des hébergements touristiques classés en France depuis le fichier CSV officiel d'Atout France.

Source de données : [Hébergements Classés Atout France](https://data.classement.atout-france.fr/static/exportHebergementsClasses/hebergements_classes.csv)  
Licence : Licence Ouverte (Open License)

## Fonctionnalités

- ✅ Extraction depuis les données ouvertes officielles (pas de scraping HTML)
- ✅ Filtres par région, département, commune
- ✅ Filtres par type d'hébergement (hôtel, camping, etc.)
- ✅ Filtres par classement étoiles
- ✅ Mode preview (5 résultats) ou extraction complète
- ✅ Limite configurable du nombre d'items
- ✅ Watermark optionnel personnalisé
- ✅ Efficace : arrêt anticipé avec maxItems
- ✅ Prix par exécution : ~0.01€

## Paramètres d'entrée

- **mode** : `preview` (5 résultats max) ou `extract` (extraction complète)
- **maxItems** : Nombre maximum d'hébergements à extraire (0 = illimité)
- **region** : Filtrer par région (vide = toutes)
- **departement** : Filtrer par département (vide = tous)
- **commune** : Filtrer par commune (vide = toutes)
- **type** : Types d'hébergements à inclure (liste)
- **stars** : Classement par nombre d'étoiles (liste)
- **watermark** : Watermark personnalisé optionnel

## Exemple d'utilisation

```json
{
  "mode": "extract",
  "maxItems": 100,
  "region": "Île-de-France",
  "type": ["Hôtel"],
  "stars": ["4", "5"]
}
```

## Données extraites

Chaque hébergement contient :
- Nom de l'établissement
- Type d'hébergement
- Classement (nombre d'étoiles)
- Adresse complète
- Commune, département, région
- Coordonnées géographiques
- Date de classement
- Autres informations disponibles dans le CSV

## Test validé

✅ 50 établissements extraits avec succès lors des tests de validation

## Licence

Les données extraites sont sous Licence Ouverte d'Atout France.
