import type { DestinationShelf } from './types';

export interface ShelfGroups {
  desktop: DestinationShelf[];
  downloads: DestinationShelf[];
}

export function groupShelvesBySource(shelves: DestinationShelf[]): ShelfGroups {
  return {
    desktop: shelves.filter((shelf) => shelf.source === 'desktop'),
    downloads: shelves.filter((shelf) => shelf.source === 'downloads'),
  };
}
