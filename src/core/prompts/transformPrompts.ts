import { TransformFormat } from '@/types/api.types';

export const getPromptForFormat = (format: TransformFormat, text: string) => {
  const prompts: Record<TransformFormat, string> = {
    'business-letter': `Transformeer de volgende tekst naar een formele zakelijke brief in het Nederlands.
      Behoud de kern van de boodschap, maar gebruik deze exacte layout:

      [Plaats], [Datum]

      Betreft: [Kort onderwerp gebaseerd op de inhoud]

      Geachte heer/mevrouw,

      [Eerste alinea: Korte introductie en aanleiding]

      [Tweede alinea: Kern van het oorspronkelijke bericht]

      [Derde alinea: Concrete vraag, verzoek of conclusie]

      Met vriendelijke groet,

      [Naam]
      [Functie]
      [Bedrijfsnaam]

      Belangrijke instructies:
      - Gebruik formeel Nederlands
      - Behoud de kernboodschap van: "${text}"
      - Volg exact deze layout met witregels
      - Maak logische alinea's
      - Houd het professioneel en zakelijk`,

    'social-post': `Transformeer de volgende tekst naar een pakkende social media post in het Nederlands.
      Volg deze richtlijnen:

      - Maximaal 280 karakters
      - Begin met een aandachttrekkende opening
      - Gebruik 2-3 relevante emoji's op natuurlijke plekken
      - Voeg 3-4 relevante hashtags toe aan het einde
      - Eindig met een duidelijke call-to-action
      - Maak het persoonlijk en engaging
      - Gebruik informele maar professionele taal
      
      Belangrijke instructies:
      - Behoud de kernboodschap van: "${text}"
      - Maak het kort en krachtig
      - Zorg dat het uitnodigt tot interactie
      - Gebruik moderne, toegankelijke taal`,

    'email': `Transformeer de volgende tekst naar een professionele e-mail in het Nederlands.
      Gebruik deze structuur:

      Onderwerp: [Kort en duidelijk]

      Beste [naam],

      [Inhoud met alinea's]

      [Afsluiting]
      [Naam]
      [Contactgegevens]

      Belangrijke instructies:
      - Behoud de kernboodschap van: "${text}"
      - Gebruik zakelijke maar toegankelijke taal
      - Maak het bondig en to-the-point
      - Zorg voor een professionele toon`,

    'bullet-points': `Transformeer de volgende tekst naar overzichtelijke bullet points...`,
    'summary': `Maak een beknopte samenvatting van de volgende tekst...`,
    'meeting-notes': `Transformeer de volgende tekst naar gestructureerde vergadernotities...`
  };

  return prompts[format].replace('${text}', text);
}; 