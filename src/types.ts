export interface Attack {
  name: string;
  description: string;
  damage: number;
}

export interface DinoStats {
  name: string;
  scientificName: string;
  period: string;
  diet: 'Herbivore' | 'Carnivore' | 'Omnivore';
  height: string;
  weight: string;
  location: string;
  funFact: string;
  description: string;
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Legendary';
  level: number;
  hp: number;
  energyType: string;
  attacks: Attack[];
  passiveAbility: {
    name: string;
    description: string;
  };
  topSpeed: string;
  discoveryYear: string;
}

export interface DinoCardData {
  stats: DinoStats;
  imageUrl: string;
  backImageUrl: string;
}

