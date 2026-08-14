import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { getStoryPortraitRig } from '../GalMainStory/characters';
import GalStoryPage from '../GalMainStory/GalStoryPage';
import LayeredPortrait from '../GalMainStory/LayeredPortrait';
import { completeNewSessionRegistration } from '../services/gameSession';
import {
  createPlayerProfile,
  normalizePlayerNamePart,
  PLAYER_BLOOD_TYPES,
  PLAYER_NAME_PART_MAX_LENGTH,
  PLAYER_PROFILE_TEXT_MAX_LENGTH,
  validatePlayerNamePart,
  validatePlayerProfileText,
} from '../stores/playerStore';
import type { PlayerBloodType, PlayerRegistrationInput } from '../types';
import { resolveAssetPath } from '../utils/assetPath';
import VelvetRoom from '../VelvetRoom/VelvetRoom';
import './PlayerRegistration.css';

interface PlayerRegistrationProps {
  onCancel: () => void;
}

type RegistrationStep =
  | 'velvet-room'
  | 'intro'
  | 'event-cg'
  | 'name'
  | 'birthday'
  | 'blood-type'
  | 'appearance'
  | 'personality'
  | 'review';
type RegistrationFormStep = Exclude<RegistrationStep, 'velvet-room' | 'intro' | 'event-cg'>;
type VelvetRoomReturnStep = 'intro' | 'personality';

const INTRO_LINES = [
  { speaker: '？？？', text: '……喂，起床啦。还要睡到什么时候？' },
  { speaker: '夕崎梨子', text: '终于醒了。入学典礼马上就要开始，再不起来真的会迟到。' },
  { speaker: '夕崎梨子', text: '高中生活第一天就迟到，我可不想陪你一起留下这种记录。' },
  { speaker: '夕崎梨子', text: '美柑一早还提醒我：“姐姐，别让那家伙睡过头。”你可别让我难交代。' },
  { speaker: '夕崎梨子', text: '出门前还得核对入学登记。自己的名字……总不会睡一觉就忘了吧？' },
] as const;

const BLOOD_TYPE_LABELS: Record<PlayerBloodType, string> = {
  A: 'A 型',
  B: 'B 型',
  AB: 'AB 型',
  O: 'O 型',
  unknown: '不明',
};

const STEP_LABELS: Record<RegistrationFormStep, string> = {
  name: '姓名',
  birthday: '生日',
  'blood-type': '血型',
  appearance: '外貌',
  personality: '性格',
  review: '确认',
};
const STEP_HINTS: Record<RegistrationFormStep, string> = {
  name: '填写姓与名后选择“下一项”',
  birthday: '选择出生月份和日期',
  'blood-type': '选择血型；不知道时可以选择“不明”',
  appearance: '用简短文字登记主角外貌',
  personality: '登记性格倾向；它不会替玩家作出选择',
  review: '核对资料后完成新生登记',
};
const REGISTRATION_STEPS = Object.keys(STEP_LABELS) as RegistrationFormStep[];

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => index + 1);
const RIKO_SPEAKER = '夕崎梨子';
const RIKO_PORTRAIT_RIG = getStoryPortraitRig('riko');

function getBirthdayDayMaximum(month: number): number {
  return new Date(2000, month, 0).getDate();
}

export default function PlayerRegistration({ onCancel }: PlayerRegistrationProps) {
  const advanceButtonRef = useRef<HTMLButtonElement>(null);
  const familyNameRef = useRef<HTMLInputElement>(null);
  const appearanceRef = useRef<HTMLTextAreaElement>(null);
  const personalityRef = useRef<HTMLTextAreaElement>(null);
  const [step, setStep] = useState<RegistrationStep>('velvet-room');
  const [introIndex, setIntroIndex] = useState(0);
  const [familyName, setFamilyName] = useState('');
  const [givenName, setGivenName] = useState('');
  const [birthdayMonth, setBirthdayMonth] = useState(4);
  const [birthdayDay, setBirthdayDay] = useState(7);
  const [bloodType, setBloodType] = useState<PlayerBloodType>('unknown');
  const [appearance, setAppearance] = useState('');
  const [personality, setPersonality] = useState('');
  // 首次拒绝或完成画像都必须从梨子的叫醒过场开始；登记中重访赛菲才原路返回性格页。
  const [velvetRoomReturnStep, setVelvetRoomReturnStep] = useState<VelvetRoomReturnStep>('intro');
  const [error, setError] = useState<string | null>(null);
  const birthdayDayMaximum = getBirthdayDayMaximum(birthdayMonth);
  const dayOptions = useMemo(
    () => Array.from({ length: birthdayDayMaximum }, (_, index) => index + 1),
    [birthdayDayMaximum],
  );
  const normalizedFamilyName = normalizePlayerNamePart(familyName);
  const normalizedGivenName = normalizePlayerNamePart(givenName);
  const displayName = `${normalizedFamilyName}${normalizedGivenName}`;
  const currentStepIndex =
    step === 'velvet-room' || step === 'intro' || step === 'event-cg' ? -1 : REGISTRATION_STEPS.indexOf(step);

  useEffect(() => {
    if (birthdayDay > birthdayDayMaximum) setBirthdayDay(birthdayDayMaximum);
  }, [birthdayDay, birthdayDayMaximum]);

  useEffect(() => {
    if (step === 'intro' || step === 'event-cg') advanceButtonRef.current?.focus();
    if (step === 'name') familyNameRef.current?.focus();
    if (step === 'appearance') appearanceRef.current?.focus();
    if (step === 'personality') personalityRef.current?.focus();
  }, [step]);

  const advanceIntro = () => {
    if (introIndex < INTRO_LINES.length - 1) {
      setIntroIndex(index => index + 1);
      return;
    }
    setStep('event-cg');
  };

  const advanceEventCg = () => setStep('name');

  const openVelvetRoom = () => {
    setVelvetRoomReturnStep('personality');
    setStep('velvet-room');
  };

  const registrationInput = (): PlayerRegistrationInput => ({
    familyName,
    givenName,
    birthdayMonth,
    birthdayDay,
    bloodType,
    appearance,
    personality,
  });

  const goBack = () => {
    setError(null);
    if (step === 'review') setStep('personality');
    else if (step === 'personality') setStep('appearance');
    else if (step === 'appearance') setStep('blood-type');
    else if (step === 'blood-type') setStep('birthday');
    else if (step === 'birthday') setStep('name');
    else if (step === 'name') onCancel();
  };

  const submitCurrentStep = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (step === 'name') {
      try {
        setFamilyName(validatePlayerNamePart(familyName));
        setGivenName(validatePlayerNamePart(givenName));
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : String(cause));
        return;
      }
      setStep('birthday');
      return;
    }

    if (step === 'birthday') {
      setStep('blood-type');
      return;
    }

    if (step === 'blood-type') {
      setStep('appearance');
      return;
    }

    if (step === 'appearance') {
      try {
        const normalizedAppearance = validatePlayerProfileText(appearance, '外貌');
        setAppearance(normalizedAppearance);
        setStep('personality');
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : String(cause));
      }
      return;
    }

    if (step === 'personality') {
      try {
        const normalizedPersonality = validatePlayerProfileText(personality, '性格');
        setPersonality(normalizedPersonality);
        createPlayerProfile({ ...registrationInput(), personality: normalizedPersonality });
        setStep('review');
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : String(cause));
      }
      return;
    }

    try {
      completeNewSessionRegistration(registrationInput());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  };

  const currentLine = INTRO_LINES[introIndex] ?? INTRO_LINES[0];
  const rikoVisible = step !== 'intro' || introIndex > 0;

  return (
    <main className="player-registration" data-registration-step={step}>
      {step === 'velvet-room' ? (
        <VelvetRoom
          onApply={({ personality: velvetPersonality }) => {
            setPersonality(velvetPersonality);
            setStep(velvetRoomReturnStep);
          }}
          onClose={() => setStep(velvetRoomReturnStep)}
          closeLabel={velvetRoomReturnStep === 'intro' ? '结束画像，去见梨子' : '返回登记'}
        />
      ) : step === 'intro' ? (
        <section
          className="gal-main-story player-registration__opening"
          role="dialog"
          aria-modal="true"
          aria-label="新游戏开场"
          tabIndex={-1}
          data-event-id="start-riko-opening"
          data-page-index={introIndex}
          data-speaker={currentLine.speaker}
          data-speaker-ui={currentLine.speaker === RIKO_SPEAKER ? 'galbox-nameplate' : 'generic-nameplate'}
          data-focus-character={rikoVisible ? 'riko' : 'hidden'}
          data-portrait-id={rikoVisible ? RIKO_PORTRAIT_RIG.id : 'hidden'}
          data-expression-id={rikoVisible ? RIKO_PORTRAIT_RIG.defaultExpressionId : 'hidden'}
          data-background="registration-room"
          data-effect="none"
          data-generation-source="authored"
          onClick={advanceIntro}
        >
          <GalStoryPage
            backgroundKey={`start-riko-opening-${introIndex}`}
            backgroundAsset="/artsource/start/registration-room.png"
            backgroundAlt="清晨的结城家房间"
            speaker={currentLine.speaker}
            text={currentLine.text}
            portrait={
              rikoVisible
                ? {
                    rig: RIKO_PORTRAIT_RIG,
                    expressionId: RIKO_PORTRAIT_RIG.defaultExpressionId,
                    isSpeaking: currentLine.speaker === RIKO_SPEAKER,
                    beatKey: introIndex,
                  }
                : null
            }
            controls={
              <nav
                className="gal-main-story__controls"
                aria-label="开场翻页"
                onClick={event => event.stopPropagation()}
              >
                <span className="gal-main-story__progress">
                  {introIndex + 1} / {INTRO_LINES.length}
                </span>
                <button
                  ref={advanceButtonRef}
                  type="button"
                  className="gal-main-story__icon-button is-primary"
                  onClick={advanceIntro}
                  aria-label={introIndex === INTRO_LINES.length - 1 ? '继续登记事件' : '继续对话'}
                  title={introIndex === INTRO_LINES.length - 1 ? '继续登记事件' : '继续对话'}
                >
                  →
                </button>
              </nav>
            }
          />
        </section>
      ) : step === 'event-cg' ? (
        <section
          className="gal-main-story player-registration__event-cg"
          role="dialog"
          aria-modal="true"
          aria-label="夕崎梨子入学登记事件"
          tabIndex={-1}
          data-event-id="start-riko-registration-cg"
          data-page-index={0}
          data-speaker={RIKO_SPEAKER}
          data-speaker-ui="galbox-nameplate"
          data-focus-character="riko"
          data-portrait-id="baked-event-cg"
          data-expression-id="fixed"
          data-background="riko-registration-cg"
          data-effect="none"
          data-generation-source="authored"
          onClick={advanceEventCg}
        >
          <GalStoryPage
            backgroundAsset="/artsource/start/riko-registration-cg.png"
            backgroundAlt="清晨在房间里陪你核对入学登记的夕崎梨子"
            speaker={RIKO_SPEAKER}
            text="入学登记表在这里。来，先把姓名填好吧。"
            controls={
              <nav
                className="gal-main-story__controls"
                aria-label="进入新生登记"
                onClick={event => event.stopPropagation()}
              >
                <button
                  ref={advanceButtonRef}
                  type="button"
                  className="gal-main-story__icon-button is-primary"
                  onClick={advanceEventCg}
                  aria-label="开始填写入学登记"
                  title="开始填写入学登记"
                >
                  →
                </button>
              </nav>
            }
          />
        </section>
      ) : (
        <section className="player-registration__form-scene" aria-label="新生登记画面">
          <img
            className="player-registration__background"
            src={resolveAssetPath('/artsource/start/registration-room.png')}
            alt="清晨的结城家房间"
          />
          <div className="player-registration__light" aria-hidden="true" />
          <LayeredPortrait
            className="player-registration__riko"
            rig={RIKO_PORTRAIT_RIG}
            expressionId={RIKO_PORTRAIT_RIG.defaultExpressionId}
            isSpeaking={false}
            beatKey={0}
            enableBlink
          />
          <section className="player-registration__form-shell" aria-labelledby="registration-title">
            <header className="player-registration__header">
              <div>
                <p>NEW STUDENT REGISTRATION</p>
                <h1 id="registration-title">新生登记</h1>
              </div>
              <ol aria-label="登记进度">
                {REGISTRATION_STEPS.map((stepId, index) => (
                  <li
                    key={stepId}
                    className={`${stepId === step ? 'is-current' : ''}${index < currentStepIndex ? ' is-complete' : ''}`}
                  >
                    <span>{index + 1}</span>
                    {STEP_LABELS[stepId]}
                  </li>
                ))}
              </ol>
            </header>

            <form className="player-registration__form" onSubmit={submitCurrentStep}>
              {step === 'name' && (
                <fieldset>
                  <legend>自己的名字，总不会忘了吧？</legend>
                  <p className="player-registration__riko-line">梨子正在旁边核对你的入学登记。</p>
                  <div className="player-registration__name-grid">
                    <label>
                      <span>姓</span>
                      <input
                        ref={familyNameRef}
                        value={familyName}
                        onChange={event => setFamilyName(event.target.value)}
                        maxLength={PLAYER_NAME_PART_MAX_LENGTH}
                        autoComplete="family-name"
                        aria-describedby="registration-name-rule"
                      />
                    </label>
                    <label>
                      <span>名</span>
                      <input
                        value={givenName}
                        onChange={event => setGivenName(event.target.value)}
                        maxLength={PLAYER_NAME_PART_MAX_LENGTH}
                        autoComplete="given-name"
                        aria-describedby="registration-name-rule"
                      />
                    </label>
                  </div>
                  <p id="registration-name-rule" className="player-registration__field-note">
                    姓和名各不超过 {PLAYER_NAME_PART_MAX_LENGTH} 个字符；登记完成后不可修改。
                  </p>
                  <div className="player-registration__fixed-field" aria-label="性别固定为男性">
                    <span>性别</span>
                    <strong>男性</strong>
                    <small>本作主角设定固定，不能更改</small>
                  </div>
                </fieldset>
              )}

              {step === 'birthday' && (
                <fieldset>
                  <legend>接下来是生日。</legend>
                  <p className="player-registration__riko-line">“别迷迷糊糊地把日期填错了。”</p>
                  <div className="player-registration__date-grid">
                    <label>
                      <span>月份</span>
                      <span className="player-registration__select-wrap">
                        <select value={birthdayMonth} onChange={event => setBirthdayMonth(Number(event.target.value))}>
                          {MONTH_OPTIONS.map(month => (
                            <option key={month} value={month}>
                              {month}
                            </option>
                          ))}
                        </select>
                        <b>月</b>
                      </span>
                    </label>
                    <label>
                      <span>日期</span>
                      <span className="player-registration__select-wrap">
                        <select value={birthdayDay} onChange={event => setBirthdayDay(Number(event.target.value))}>
                          {dayOptions.map(day => (
                            <option key={day} value={day}>
                              {day}
                            </option>
                          ))}
                        </select>
                        <b>日</b>
                      </span>
                    </label>
                  </div>
                </fieldset>
              )}

              {step === 'blood-type' && (
                <fieldset>
                  <legend>最后选择血型。</legend>
                  <p className="player-registration__riko-line">“不知道也没关系，老实选‘不明’就好。”</p>
                  <div className="player-registration__blood-types">
                    {PLAYER_BLOOD_TYPES.map(value => (
                      <label key={value} className={bloodType === value ? 'is-selected' : ''}>
                        <input
                          type="radio"
                          name="blood-type"
                          value={value}
                          checked={bloodType === value}
                          onChange={() => setBloodType(value)}
                        />
                        <span>{BLOOD_TYPE_LABELS[value]}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              )}

              {step === 'appearance' && (
                <fieldset>
                  <legend>登记你的外貌。</legend>
                  <p className="player-registration__riko-line">
                    “写清楚就好。没有登记的细节，之后也不会擅自替你补上。”
                  </p>
                  <label className="player-registration__text-field">
                    <span>外貌</span>
                    <textarea
                      ref={appearanceRef}
                      value={appearance}
                      onChange={event => setAppearance(event.target.value)}
                      rows={4}
                      aria-describedby="registration-appearance-rule"
                    />
                  </label>
                  <p id="registration-appearance-rule" className="player-registration__field-note">
                    必填，NFKC 规范化后不超过 {PLAYER_PROFILE_TEXT_MAX_LENGTH} 个 Unicode 字符；当前{' '}
                    {Array.from(appearance.normalize('NFKC')).length} 个。
                  </p>
                </fieldset>
              )}

              {step === 'personality' && (
                <fieldset>
                  <legend>最后登记性格倾向。</legend>
                  <p className="player-registration__riko-line">
                    “这只描述平时的倾向。关键行动、对白和路线，当然还是由你自己决定。”
                  </p>
                  <label className="player-registration__text-field">
                    <span>性格</span>
                    <textarea
                      ref={personalityRef}
                      value={personality}
                      onChange={event => setPersonality(event.target.value)}
                      rows={4}
                      aria-describedby="registration-personality-rule"
                    />
                  </label>
                  <p id="registration-personality-rule" className="player-registration__field-note">
                    必填，NFKC 规范化后不超过 {PLAYER_PROFILE_TEXT_MAX_LENGTH} 个 Unicode 字符；当前{' '}
                    {Array.from(personality.normalize('NFKC')).length} 个。
                  </p>
                  <button type="button" className="player-registration__velvet-room-entry" onClick={openVelvetRoom}>
                    前往天鹅绒房间，让赛菲分析性格
                  </button>
                </fieldset>
              )}

              {step === 'review' && (
                <fieldset>
                  <legend>登记资料确认</legend>
                  <p className="player-registration__riko-line">
                    “确认以后名字就不能改了。最后检查一次，我可不会替你背填错资料的锅。”
                  </p>
                  <dl className="player-registration__review">
                    <div>
                      <dt>姓名</dt>
                      <dd>{displayName}</dd>
                    </div>
                    <div>
                      <dt>性别</dt>
                      <dd>男性</dd>
                    </div>
                    <div>
                      <dt>生日</dt>
                      <dd>
                        {birthdayMonth} 月 {birthdayDay} 日
                      </dd>
                    </div>
                    <div>
                      <dt>血型</dt>
                      <dd>{BLOOD_TYPE_LABELS[bloodType]}</dd>
                    </div>
                    <div className="is-long">
                      <dt>外貌</dt>
                      <dd>{appearance}</dd>
                    </div>
                    <div className="is-long">
                      <dt>性格</dt>
                      <dd>{personality}</dd>
                    </div>
                  </dl>
                </fieldset>
              )}

              {error && (
                <p className="player-registration__error" role="alert">
                  {error}
                </p>
              )}

              <footer className="player-registration__actions">
                <button type="button" className="is-secondary" onClick={goBack}>
                  {step === 'name' ? '返回标题' : '返回修改'}
                </button>
                <button type="submit" className="is-primary">
                  {step === 'review' ? '确认登记' : '下一项'}
                </button>
              </footer>
            </form>
            <footer className="player-registration__status-bar" aria-label={`登记进度：${STEP_HINTS[step]}`}>
              <strong>
                <span aria-hidden="true">♥</span> STUDENT DATA
              </strong>
              <p>{STEP_HINTS[step]}</p>
              <b>
                {currentStepIndex + 1} / {REGISTRATION_STEPS.length}
              </b>
            </footer>
          </section>
        </section>
      )}
    </main>
  );
}
