import { SeoArticle, articleStyles } from '@/src/components/web/SeoArticle';
import { H2, P } from '@expo/html-elements';
import React from 'react';

export default function FocusTimerAdhdPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Do timers help with ADHD focus?',
        acceptedAnswer: { '@type': 'Answer', text: 'Many people with ADHD find external timers helpful because they make time visible and turn open-ended tasks into short, concrete commitments. A draining hourglass adds a calm visual cue.' },
      },
      {
        '@type': 'Question',
        name: 'What timer length is best for ADHD?',
        acceptedAnswer: { '@type': 'Answer', text: 'Start small. Even a 10–15 minute focus block can be easier to begin than 25. Flowglass lets you set a custom work and break length so you can find what fits.' },
      },
    ],
  };

  return (
    <SeoArticle
      path="/focus-timer-adhd"
      title="Focus Timer for ADHD — Free, Visual & Simple | Flowglass"
      description="A free, low-distraction focus timer that helps with ADHD. Make time visible, start tasks more easily, and customize your work and break lengths."
      h1="Focus Timer for ADHD"
      intro="Make time visible and tasks easier to start. Press start below, or set a shorter custom block that feels achievable today."
      timerMinutes={15}
      jsonLd={jsonLd}
      related={[
        { href: '/pomodoro-timer', label: 'Free Pomodoro Timer' },
        { href: '/deep-work-timer', label: 'Deep Work Timer' },
      ]}
    >
      <H2 style={articleStyles.h2}>Why timers help with ADHD</H2>
      <P style={articleStyles.p}>
        For many people with ADHD, time feels abstract — it is either “now” or “not now.” A visible countdown turns that fog into
        something concrete. When the task is “focus until the hourglass empties,” starting is far less daunting than facing an
        open-ended afternoon of work. The timer also externalizes the decision to keep going, so you are not relying on willpower alone.
      </P>
      <P style={articleStyles.p}>
        Flowglass keeps the screen calm on purpose. There are no flashing colors, no aggressive ticking, and no clutter — just a
        gentle draining hourglass, the time remaining, and a single start button. Less on screen means fewer things to pull your
        attention away.
      </P>

      <H2 style={articleStyles.h2}>Start small and adjust</H2>
      <P style={articleStyles.p}>
        Twenty-five minutes can feel like a wall on a hard day. With the Custom technique you can set any work and break length —
        try a 10 or 15 minute block to get moving. Momentum matters more than length: once you have started, continuing is easy.
        You can always run another short block, and another, until the work is done.
      </P>
      <P style={articleStyles.p}>
        Save your favorite setup as a preset so it is one tap away next time. Flowglass remembers it, along with the time you have
        focused, so good days are visible and repeatable.
      </P>

      <H2 style={articleStyles.h2}>Body doubling and breaks</H2>
      <P style={articleStyles.p}>
        Pair the timer with a clear, single task and a tidy space. Use breaks to stand and move rather than switch to your phone,
        which can quietly eat the rest of your afternoon. Flowglass is free, needs no login, and runs on web, iOS, and Android, so
        the same calm timer is always within reach. Begin with the short block above whenever you are ready.
      </P>
    </SeoArticle>
  );
}
