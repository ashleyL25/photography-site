import { Hero } from '@/sections/Hero'
import { Marquee } from '@/sections/Marquee'
import { Story } from '@/sections/Story'
import { Sessions } from '@/sections/Sessions'
import { Selected } from '@/sections/Selected'
import { Process } from '@/sections/Process'
import { About } from '@/sections/About'
import { Contact } from '@/sections/Contact'
import { useDocumentMeta } from '@/lib/hooks'

export default function Home() {
  useDocumentMeta(
    'Ashley Photography — Senior, Couple & Family Portraits in Des Moines, Iowa',
    'Natural-light portrait photography based in Urbandale, serving the Des Moines metro and central Iowa. Senior pictures, graduation, engagements, couples, families and pets.',
  )

  return (
    <>
      <Hero />
      <Marquee />
      <Story />
      <Sessions />
      <Selected />
      <Process />
      {/* The gallery timeline (`Delivery`) used to sit here. It is delivery
          detail rather than a reason to book, so it lives at the foot of the
          contact page now. */}
      <About />
      <Contact />
    </>
  )
}
