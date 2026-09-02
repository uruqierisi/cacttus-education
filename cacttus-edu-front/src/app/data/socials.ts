import React from "react";
import { Facebook, Instagram, Linkedin } from "lucide-react";
import { TikTokIcon } from "../ui/TikTokIcon";


/**
 * The real Cacttus Education profiles, in ONE place.
 *
 * Both social rows on the site (the footer and /kontakti's "Na ndiq") read from here, so
 * a profile URL is corrected once rather than in two files that drift apart.
 */
export const SOCIAL_URLS = {
  facebook: "https://www.facebook.com/cacttusedu",
  instagram: "https://www.instagram.com/cacttuseducation/",
  linkedin: "https://www.linkedin.com/school/cacttusedu/posts/?feedView=all",
  tiktok: "https://www.tiktok.com/@cacttuseducation",
} as const;


export type SocialLink = { Icon: React.ElementType; label: string; href: string };


export const FOOTER_SOCIALS: readonly SocialLink[] = [
  { Icon: Facebook, label: "Facebook", href: SOCIAL_URLS.facebook },
  { Icon: TikTokIcon, label: "TikTok", href: SOCIAL_URLS.tiktok },
  { Icon: Instagram, label: "Instagram", href: SOCIAL_URLS.instagram },
  { Icon: Linkedin, label: "LinkedIn", href: SOCIAL_URLS.linkedin },
];


/**
 * The same four profiles for /kontakti's "Na ndiq" row.
 *
 * Separate array only because that row renders a different shape of control; the ORDER
 * matches the footer so the two rows read alike. It carries TikTok, not Twitter — the
 * row used to show a Twitter glyph, and Cacttus has no Twitter profile for it to open.
 */
export const CONTACT_SOCIALS: readonly SocialLink[] = [
  { Icon: Facebook, label: "Facebook", href: SOCIAL_URLS.facebook },
  { Icon: Instagram, label: "Instagram", href: SOCIAL_URLS.instagram },
  { Icon: Linkedin, label: "LinkedIn", href: SOCIAL_URLS.linkedin },
  { Icon: TikTokIcon, label: "TikTok", href: SOCIAL_URLS.tiktok },
];


export const FOOTER_LINKS: readonly (readonly [string, string])[] = [
  ["Rreth nesh", "/rreth-nesh"],
  ["Projektet", "/projektet"],
  ["Studime Profesionale", "/programim"],
  ["Trajnime profesionale", "/trajnime"],
  ["Biznese", "/biznese"],
];
