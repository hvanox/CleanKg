// Reference data and the demo dataset, copied from prototipe/api/app/seed.py (CATEGORY_SPECS, DEMO_USER_SPECS,
// DEMO_ORGANISATION_SPECS, DEMO_REPORTS). The demo dataset is entirely fictional and every report is labelled «демо» in the
// description and flagged `is_demo` (HR-1). Coordinates are approximate Bishkek points for a map demo, not real complaints.
// Categories: Docs/02-product/taxonomy.md. Kyrgyz category labels are not written yet, so `label_ky` stays null.

import type { Size, Status } from "../types";
import type { UserRole } from "./types";

/** code, label_ru, volunteer_allowed, max_volunteer_size, is_hazardous, sort_order */
export const CATEGORY_SPECS: readonly (readonly [string, string, boolean, string | null, boolean, number])[] = [
  ["illegal_dump", "Стихийная свалка", true, "medium", false, 10],
  ["overflowing_container", "Переполненный контейнер", false, null, false, 20],
  ["missed_collection", "Мусор не вывезли", false, null, false, 30],
  ["trash_burning", "Сжигание мусора", false, null, false, 40],
  ["construction_debris", "Строительный мусор", false, null, false, 50],
  ["littered_area", "Замусоренная территория (парк, берег, арык)", true, null, false, 60],
  ["hazardous_waste", "Опасные отходы (батарейки, медицинские, химия)", false, null, true, 70]
];

/** key, display name, account role. The role is what the API trusts (QA-P01 D2); ids are 1 to 4 in this order. */
export const DEMO_USER_SPECS: readonly (readonly [string, string, UserRole])[] = [
  ["resident", "Айгуль", "resident"],
  ["operator", "Данияр", "operator"],
  ["volunteer", "Эрмек", "volunteer"],
  ["moderator", "Мээрим", "moderator"]
];

/** key, name, type. HR-2: demo organisations are explicitly NOT connected. ids are 1 and 2 in this order. */
export const DEMO_ORGANISATION_SPECS: readonly (readonly [string, string, string])[] = [
  ["municipal", "Городская служба вывоза (демо)", "municipal"],
  ["ngo", "Эко-НКО «Арык» (демо)", "ngo"]
];

export interface DemoReportSpec {
  key: string;
  category: string;
  size: Size;
  lat: number;
  lng: number;
  description: string;
  author: string;
  anonymous: boolean;
  stage: Status;
  age_days: number;
  age_hours: number;
  claim: "volunteer" | "operator" | null;
  rejection_reason: string | null;
}

export const DEMO_REPORTS: readonly DemoReportSpec[] = [
  {
    "key": "toktogula-dump",
    "category": "illegal_dump",
    "size": "medium",
    "lat": 42.8767,
    "lng": 74.5892,
    "description": "свалка у арыка на ул. Токтогула, рядом с остановкой",
    "author": "resident",
    "anonymous": false,
    "stage": "confirmed",
    "age_days": 20,
    "claim": "volunteer",
    "age_hours": 0,
    "rejection_reason": null
  },
  {
    "key": "chuy-avenue-dump",
    "category": "illegal_dump",
    "size": "medium",
    "lat": 42.8691,
    "lng": 74.6123,
    "description": "навал у проспекта Чуй, за остановкой, убран частично",
    "author": "operator",
    "anonymous": false,
    "stage": "resolved",
    "age_days": 9,
    "claim": "volunteer",
    "age_hours": 0,
    "rejection_reason": null
  },
  {
    "key": "burning-yard",
    "category": "trash_burning",
    "size": "medium",
    "lat": 42.8822,
    "lng": 74.5411,
    "description": "во дворе жгут мусор, дым идёт в окна",
    "author": "moderator",
    "anonymous": false,
    "stage": "under_review",
    "age_days": 1,
    "claim": null,
    "age_hours": 0,
    "rejection_reason": null
  },
  {
    "key": "batteries-yard",
    "category": "hazardous_waste",
    "size": "small",
    "lat": 42.8905,
    "lng": 74.5762,
    "description": "коробка с батарейками и химией у мусорных баков",
    "author": "resident",
    "anonymous": false,
    "stage": "under_review",
    "age_days": 2,
    "claim": null,
    "age_hours": 0,
    "rejection_reason": null
  },
  {
    "key": "container-sverdlovsky",
    "category": "overflowing_container",
    "size": "medium",
    "lat": 42.8633,
    "lng": 74.5977,
    "description": "контейнер переполнен, мусор вокруг площадки",
    "author": "operator",
    "anonymous": false,
    "stage": "in_progress",
    "age_days": 4,
    "claim": "operator",
    "age_hours": 0,
    "rejection_reason": null
  },
  {
    "key": "park-cleanup",
    "category": "littered_area",
    "size": "medium",
    "lat": 42.9012,
    "lng": 74.5603,
    "description": "замусорен берег канала в парке, нужен субботник",
    "author": "moderator",
    "anonymous": false,
    "stage": "in_progress",
    "age_days": 3,
    "claim": "volunteer",
    "age_hours": 0,
    "rejection_reason": null
  },
  {
    "key": "missed-street",
    "category": "missed_collection",
    "size": "small",
    "lat": 42.8587,
    "lng": 74.5488,
    "description": "мусор не вывезли второй день, баки у дома",
    "author": "resident",
    "anonymous": true,
    "stage": "submitted",
    "age_days": 0,
    "age_hours": 3,
    "claim": null,
    "rejection_reason": null
  },
  {
    "key": "debris-yard",
    "category": "construction_debris",
    "size": "large",
    "lat": 42.8811,
    "lng": 74.6202,
    "description": "строительный мусор после ремонта во дворе",
    "author": "operator",
    "anonymous": false,
    "stage": "rejected",
    "age_days": 6,
    "claim": null,
    "rejection_reason": "not_waste",
    "age_hours": 0
  },
  {
    "key": "anonymous-aryk",
    "category": "illegal_dump",
    "size": "small",
    "lat": 42.8689,
    "lng": 74.5321,
    "description": "мусор в арыке, вода не проходит",
    "author": "moderator",
    "anonymous": true,
    "stage": "confirmed",
    "age_days": 30,
    "claim": "volunteer",
    "age_hours": 0,
    "rejection_reason": null
  },
  {
    "key": "embankment-litter",
    "category": "littered_area",
    "size": "massive",
    "lat": 42.9077,
    "lng": 74.5851,
    "description": "замусорена набережная после выходных, много пластика",
    "author": "resident",
    "anonymous": false,
    "stage": "under_review",
    "age_days": 2,
    "claim": null,
    "age_hours": 0,
    "rejection_reason": null
  },
  {
    "key": "disputed-dump",
    "category": "illegal_dump",
    "size": "medium",
    "lat": 42.8556,
    "lng": 74.5752,
    "description": "свалка у школы, по словам жителей всё ещё на месте",
    "author": "operator",
    "anonymous": false,
    "stage": "disputed",
    "age_days": 12,
    "claim": "volunteer",
    "age_hours": 0,
    "rejection_reason": null
  },
  {
    "key": "container-oktyabrsky",
    "category": "overflowing_container",
    "size": "small",
    "lat": 42.8712,
    "lng": 74.6034,
    "description": "переполненный контейнер у рынка, вывезли",
    "author": "resident",
    "anonymous": false,
    "stage": "confirmed",
    "age_days": 45,
    "claim": "operator",
    "age_hours": 0,
    "rejection_reason": null
  },
  {
    "key": "missed-oktyabrsky",
    "category": "missed_collection",
    "size": "medium",
    "lat": 42.8841,
    "lng": 74.5647,
    "description": "не вывезли мусор после праздников",
    "author": "moderator",
    "anonymous": false,
    "stage": "under_review",
    "age_days": 1,
    "claim": null,
    "age_hours": 0,
    "rejection_reason": null
  },
  {
    "key": "volunteer-dump",
    "category": "illegal_dump",
    "size": "medium",
    "lat": 42.8948,
    "lng": 74.5509,
    "description": "свалка во дворе, волонтёры уже убирают",
    "author": "operator",
    "anonymous": false,
    "stage": "in_progress",
    "age_days": 3,
    "claim": "volunteer",
    "age_hours": 0,
    "rejection_reason": null
  },
  {
    "key": "burning-confirmed",
    "category": "trash_burning",
    "size": "large",
    "lat": 42.86,
    "lng": 74.63,
    "description": "жгли ветки и мусор на пустыре, потушено службой",
    "author": "moderator",
    "anonymous": false,
    "stage": "confirmed",
    "age_days": 25,
    "claim": "operator",
    "age_hours": 0,
    "rejection_reason": null
  }
];
