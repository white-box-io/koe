import { useState } from "react";
import { Panel, PanelHeader } from "../../components/panel/Panel";
import { Button, StepDots } from "../../components/ui/controls";
import { useKoe } from "../../state/KoeProvider";
import { DownloadStep, KeyStep, MicStep, VoiceStep, WelcomeStep } from "./steps";
import "./setup.css";

const STEPS = [
  { title: "", Body: WelcomeStep, next: "Get started" },
  { title: "Microphone", Body: MicStep, next: "Continue" },
  { title: "Talk key", Body: KeyStep, next: "Continue" },
  { title: "Voice", Body: VoiceStep, next: "Continue" },
  { title: "Getting ready", Body: DownloadStep, next: "Finish" },
];

export function SetupPanel() {
  const { state, updateSettings } = useKoe();
  const [step, setStep] = useState(0);
  const { title, Body, next } = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const canFinish = !isLast || state.engineReady;

  const goNext = () => {
    if (isLast) updateSettings({ setupDone: true });
    else setStep(step + 1);
  };

  return (
    <Panel width={300}>
      {title && <PanelHeader title={title} right={<span className="setup__count">{step + 1} of 5</span>} />}
      <Body />
      <div className="setup__footer">
        <StepDots active={step} total={STEPS.length} />
        <div className="setup__buttons">
          {step > 0 && !isLast && (
            <Button kind="secondary" onClick={() => setStep(step - 1)}>
              Back
            </Button>
          )}
          <Button onClick={goNext} disabled={!canFinish}>
            {next}
          </Button>
        </div>
      </div>
    </Panel>
  );
}
