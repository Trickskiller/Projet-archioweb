# Projet-archioweb

## Notre projet

Le but de notre API consiste à développer une application mobile qui répertorie les places de parking disponibles. Les utilisateurs peuvent mettre à disposition leur place de parking et peuvent louer les places d’autres utilisateurs. L’utilisateur qui met en location sa place (bailleur), définit leur heures et dates de disponibilités pour les autres. Il pourra par la suite regarder quelle voiture utilise sa place de parc.

L’utilisateur qui souhaite louer une place va rechercher des places disponibles selon la date, l’heure et la localisation qu’il souhaite et pourra la réserver pour x temps.

Le lien de notre app : https://parking-app-jc1u.onrender.com

### Structure

```markdown
Users:

- userId
- admin (booleen)
- firstName
- lastName
- userName
- password

Place de parc:

- placeId
- description
- type
- geolocation
- picture
- userId


Véhicule :

- vehiculeId
- type
- registrationNumber
- color
- brand
- userId

Réservation :
- reservationId
- parkingId
- renterUserId
- ownerUserId
- startDate
- endDate
- status
```

**Paginated list :**

1. Listes des users 
2. Liste des personnes qui ont réservé la place

**Filtres :**

- Les places
  - type de places ("Parking couvert", "Parking ouvert", "Garage", "Autre")

**Aggregated data :**

- Number de places posted par un user

**Real Time :**

1. L’utilisateur est notifié quand lorsqu’il y a un nouvelle réservation sur sa place.
2. L’utiliseur est notifé lorsque de nouvelles places sont posté sur l'API

Dea, Andy, Lara
