import { ArticleH2, ArticleP, SeoArticle } from '@/src/components/web/SeoArticle';
import React from 'react';

export default function DeepWorkTimerPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is a deep work timer?',
        acceptedAnswer: { '@type': 'Answer', text: 'A deep work timer protects a long, uninterrupted block — often 50 to 90 minutes — for cognitively demanding work, followed by a real recovery break.' },
      },
      {
        '@type': 'Question',
        name: 'How long should a deep work session be?',
        acceptedAnswer: { '@type': 'Answer', text: 'Common choices are 50/10 and 90/20. Flowglass includes a 52/17 method and a fully custom option so you can match your own attention span.' },
      },
    ],
  };

  return (
    <SeoArticle
      path="/deep-work-timer"
      title="Deep Work Timer — Free 50/90 Minute Focus | Flowglass"
      description="A free deep work timer for long, uninterrupted focus. Use 52/17 or set a custom 50 or 90 minute block, then track your deep hours."
      h1="Deep Work Timer"
      intro="Protect a long, uninterrupted block for your most demanding work. Start a deep session below or set your own length."
      timerMinutes={50}
      jsonLd={jsonLd}
      related={[
        { href: '/pomodoro-timer', label: 'Free Pomodoro Timer' },
        { href: '/focus-timer-for-students', label: 'Focus Timer for Students' },
      ]}
    >
      <ArticleH2>What deep work really needs</ArticleH2>
      <ArticleP>
        Deep work is the focused, undistracted effort that produces your best thinking — writing, coding, designing, problem solving.
        It cannot be rushed in five-minute gaps between notifications. It needs a protected block long enough to load the problem fully
        into your mind and stay there. A deep work timer guards that block: you decide the length, press start, and treat the session
        as non-negotiable until the time is up.
      </ArticleP>
      <ArticleP>
        Flowglass keeps the interface quiet so nothing competes with the work. The draining hourglass gives you an ambient sense of
        time without a distracting clock. There is no feed and no noise — just an XP bar that fills when the block is done, and you
        can switch off animations entirely with Reduce motion.
      </ArticleP>

      <ArticleH2>52/17, 50/10, or 90/20?</ArticleH2>
      <ArticleP>
        There is no single correct length. The popular 52/17 rhythm — 52 minutes on, 17 off — is one way to balance intensity and
        recovery, and it is built into Flowglass. Others prefer 50/10 or a single 90-minute block. With the Custom technique you can
        set any work and break length and save it as a preset.
      </ArticleP>
      <ArticleP>
        Whatever you choose, the break is part of the method, not a reward to skip. A genuine pause — away from screens — is what lets
        the next deep block be just as productive.
      </ArticleP>

      <ArticleH2>See your deep hours add up</ArticleH2>
      <ArticleP>
        Every session you finish is logged to a skill, so your deep work hours accumulate into a weekly picture — and into XP and skill
        levels. Protecting even one or two deep blocks a day adds up. Start a deep session above, and if you are new to structured
        focus, read what the Pomodoro Technique is first.
      </ArticleP>
    </SeoArticle>
  );
}
