"use client";
import React, { useEffect, useRef, useState } from "react";
import {
  DEMO,
  api,
  route,
  getSession,
  getTracking,
  setTracking,
  setSession,
  mapOrder,
} from "./api.js";
import LiveArea from "./LiveArea.jsx";
import AuthModal from "../authModal/index.jsx";

const paths = {
  arrow: (
    <>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </>
  ),
  chevron: <path d="m9 5 7 7-7 7" />,
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="m3 6 9 7 9-7" />
    </>
  ),
  headphones: (
    <>
      <path d="M4 14v-3a8 8 0 0 1 16 0v3M4 13H3v6h4v-6H4Zm16 0h1v6h-4v-6h3ZM17 19c0 2-2 2-5 2" />
    </>
  ),
  tool: (
    <path d="M14 6a5 5 0 0 0-6 6L3 17a2.8 2.8 0 0 0 4 4l5-5a5 5 0 0 0 6-6l-4 3-3-3 3-4Z" />
  ),
  laptop: (
    <>
      <rect x="5" y="3" width="14" height="13" rx="2" />
      <path d="m5 16-3 4h20l-3-4M10 19h4" />
    </>
  ),
  phone: (
    <>
      <rect x="6" y="2" width="12" height="20" rx="3" />
      <path d="M10 5h4M11 19h2" />
    </>
  ),
  monitor: (
    <>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M12 17v4M7 21h10" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  shield: (
    <>
      <path d="m12 2 8 4v6c0 5-8 10-8 10S4 17 4 12V6l8-4Z" />
      <path d="m8 11 3 3 5-5" />
    </>
  ),
  search: (
    <>
      <circle cx="10" cy="10" r="6" />
      <path d="m15 15 6 6" />
    </>
  ),
  box: (
    <>
      <path d="m12 2 9 5v10l-9 5-9-5V7l9-5Z" />
      <path d="m3 7 9 5 9-5M12 12v10M7 4.5l10 5.5" />
    </>
  ),
  file: (
    <>
      <path d="M14 2H5v20h14V7l-5-5Z" />
      <path d="M14 2v6h5M8 12h8M8 16h8" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 22v-3a8 8 0 0 1 16 0v3" />
    </>
  ),
  menu: <path d="M3 6h18M3 12h18M3 18h18" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6M12 7v1" />
    </>
  ),
  download: (
    <>
      <path d="M12 3v12m-5-5 5 5 5-5M3 15v6h18v-6" />
    </>
  ),
  trash: (
    <>
      <path d="M3 6h18M8 6V3h8v3M5 6l1 15h12l1-15M10 10v7M14 10v7" />
    </>
  ),
  minus: <path d="M5 12h14" />,
  plus: <path d="M12 5v14M5 12h14" />,
  pin: (
    <>
      <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </>
  ),
};
function Icon({ name = "arrow", size = 22, ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {paths[name] || paths.arrow}
    </svg>
  );
}
const nav = [
  ["inicio", "Início"],
  ["servicos", "Serviços"],
  ["como-funciona", "Como funciona"],
  ["sobre", "Sobre nós"],
  ["contato", "Contato"],
];
const validPages = [
  "inicio",
  "servicos",
  "como-funciona",
  "sobre",
  "contato",
  "orcamento",
  "acompanhar",
  "area-cliente",
];
const STORAGE = "techassist-pro-demo-v1";
const stages = [
  "Recebido",
  "Diagnóstico",
  "Aprovação",
  "Em reparo",
  "Pronto",
  "Entregue",
];
const sample = {
  id: "TAP-2026-001",
  name: "Cliente de demonstração",
  email: "cliente@exemplo.com",
  phone: "(11) 99999-0000",
  type: "Notebook",
  brand: "Dell",
  model: "Inspiron 15",
  serial: "EXEMPLO-001",
  issue: "O notebook está lento e não inicia o sistema operacional.",
  stage: 2,
  service: "Diagnóstico e reparo",
  created: "2026-10-29T12:00:00.000Z",
  diagnosis:
    "O SSD apresentou falhas de leitura. Recomendamos a substituição da unidade e a reinstalação do sistema operacional.",
  parts: [
    { name: "SSD SATA 480 GB", qty: 1, value: 249.9 },
    { name: "Instalação e configuração", qty: 1, value: 95 },
    { name: "Limpeza interna", qty: 1, value: 60 },
  ],
  history: [
    {
      title: "Equipamento recebido",
      note: "Conferência inicial e registro do equipamento.",
      date: "2026-10-29T12:00:00Z",
    },
    {
      title: "Diagnóstico concluído",
      note: "Falha identificada no armazenamento.",
      date: "2026-10-30T12:00:00Z",
    },
    {
      title: "Orçamento disponível",
      note: "Aguardando sua aprovação para iniciar o reparo.",
      date: "2026-10-30T13:00:00Z",
    },
  ],
  demo: true,
};
const money = (n) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const date = (s) =>
  new Date(s).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
function readOrders() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE) || "[]");
  } catch {
    return [];
  }
}
function saveOrders(value) {
  try {
    localStorage.setItem(STORAGE, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
function makeId() {
  return `TAP-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}
function Breadcrumb({ current }) {
  return (
    <div className="breadcrumb">
      <a href={route("inicio")}>Início</a>
      <Icon name="chevron" size={12} />
      <span>{current}</span>
    </div>
  );
}
function Eyebrow({ children }) {
  return (
    <div className="eyebrow">
      <span />
      {children}
    </div>
  );
}
function Primary({ children, href, className = "", ...rest }) {
  return href ? (
    <a href={href} className={"button primary " + className} {...rest}>
      {children}
      <Icon size={18} />
    </a>
  ) : (
    <button className={"button primary " + className} {...rest}>
      {children}
      <Icon size={18} />
    </button>
  );
}
function Field({ label, required = false, children, hint, className = "" }) {
  return (
    <label className={"field " + className}>
      <span>
        {label}
        {required && <i> *</i>}
      </span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
function Notice({ children }) {
  return (
    <div className="notice">
      <Icon name="info" size={16} />
      <span>{children}</span>
    </div>
  );
}
function Privacy({ onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const prev = document.activeElement;
    ref.current?.focus();
    function key(e) {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const el = ref.current?.querySelectorAll("button,a");
        if (!el?.length) return;
        const first = el[0],
          last = el[el.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", key);
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", key);
      document.body.style.overflow = old;
      prev?.focus();
    };
  }, [onClose]);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="privacy-title"
        tabIndex={-1}
        ref={ref}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="close"
          aria-label="Fechar política de privacidade"
          onClick={onClose}
        >
          <Icon name="close" />
        </button>
        <Eyebrow>SEUS DADOS</Eyebrow>
        <h2 id="privacy-title">
          {DEMO ? "Privacidade nesta prévia" : "Dados do atendimento"}
        </h2>
        {!DEMO ? (
          <>
            <p>
              Nome, e-mail e telefone identificam o atendimento. As informações
              do equipamento, do diagnóstico e do orçamento são utilizadas para
              gerenciar o serviço e apresentar o acompanhamento.
            </p>
            <p>
              As mensagens e solicitações são registradas no banco de dados do
              TechAssist Pro e ficam disponíveis para a equipe autorizada. Não
              informe senhas do equipamento, dados bancários ou informações
              desnecessárias para o reparo.
            </p>
            <p>
              O acesso à conta utiliza uma sessão temporária neste navegador.
              Entre em contato com a equipe responsável pelo sistema para
              solicitar correção ou exclusão dos seus dados.
            </p>
          </>
        ) : (
          <>
            <p>
              Os dados informados servem apenas para testar as telas do
              TechAssist Pro. Não há envio de mensagens, atendimento ou acesso a
              um banco de dados real.
            </p>
            <p>
              Solicitações de orçamento são salvas somente neste navegador.
              Evite informar dados pessoais reais nesta demonstração. Você pode
              apagar essas solicitações na Área do cliente.
            </p>
            <p>
              O formulário de contato mantém as informações apenas enquanto esta
              página está aberta. O funcionamento real e a política definitiva
              devem ser configurados antes do lançamento.
            </p>
          </>
        )}
        <Primary onClick={onClose}>Entendi</Primary>
      </section>
    </div>
  );
}
function FAQ() {
  const items = [
    [
      "Como solicito um orçamento?",
      "Abra “Solicitar orçamento”, informe seus dados e descreva o equipamento e o problema. O orçamento final depende da avaliação técnica; nenhum reparo deve começar sem sua aprovação.",
    ],
    [
      "Como acompanho o reparo do meu equipamento?",
      "Na página “Acompanhar reparo”, consulte a ordem com o código e o e-mail usados na solicitação. Use o código de acompanhamento fornecido na abertura do atendimento.",
    ],
    [
      "Preciso aprovar o orçamento antes do reparo?",
      "Sim. O fluxo prevê a apresentação do diagnóstico, das peças e dos valores para que você aprove ou recuse o orçamento antes do início do serviço.",
    ],
    [
      "Quais informações preciso enviar?",
      "Nome, e-mail, telefone, tipo de equipamento, marca, modelo e uma descrição do problema. O número de série é opcional. Não informe senhas ou dados bancários.",
    ],
  ];
  return (
    <section className="faq-section container">
      <div>
        <Eyebrow>TIRE SUAS DÚVIDAS</Eyebrow>
        <h2>
          Antes de falar,
          <br />
          talvez a resposta
          <br />
          esteja aqui.
        </h2>
        <a className="text-link" href={route("orcamento")}>
          Solicitar um orçamento <Icon size={17} />
        </a>
      </div>
      <div className="faq-list">
        {items.map(([q, a]) => (
          <details key={q}>
            <summary>
              {q}
              <span className="faq-plus">
                <Icon name="plus" size={18} />
              </span>
            </summary>
            <p>{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
function Contact({ openPrivacy }) {
  const [sent, setSent] = useState(null);
  const [count, setCount] = useState(0);
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    const fd = Object.fromEntries(new FormData(e.currentTarget));
    setError("");
    setBusy(true);
    try {
      if (!DEMO)
        await api("/contatos", {
          method: "POST",
          body: {
            nome: fd.name,
            email: fd.email,
            telefone: fd.phone,
            assunto: fd.subject,
            mensagem: fd.message,
            consentimento: fd.consent === "on",
          },
        });
      setSent(fd);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
    window.setTimeout(
      () => document.getElementById("contact-success")?.focus(),
      0,
    );
  }
  return (
    <>
      <section className="page-hero contact-hero">
        <div className="container">
          <Breadcrumb current="Contato" />
          <div className="hero-heading">
            <div>
              <Eyebrow>ESTAMOS AQUI PARA AJUDAR</Eyebrow>
              <h1>
                Vamos encontrar
                <br />
                <em>uma solução.</em>
              </h1>
            </div>
            <p>
              Uma dúvida, um equipamento com problema
              <br className="desktop" /> ou um novo orçamento. Conte com a gente
              <br className="desktop" /> para dar o próximo passo.
            </p>
          </div>
        </div>
        <div className="hero-ring" />
      </section>
      <section className="container contact-layout">
        <aside className="contact-aside">
          <div className="aside-intro">
            <span className="red-dash" />
            <h2>
              Toda solução começa
              <br />
              com uma conversa.
            </h2>
            <p>Escolha o caminho que faz sentido para você.</p>
          </div>
          <a
            href={route("contato")}
            className="contact-option"
            onClick={() => document.getElementById("contact-name")?.focus()}
          >
            <span className="square-icon">
              <Icon name="mail" />
            </span>
            <span>
              <strong>Fale com a nossa equipe</strong>
              <small>Envie sua dúvida pelo formulário.</small>
            </span>
            <Icon name="arrow" size={18} />
          </a>
          <a href={route("orcamento")} className="contact-option">
            <span className="square-icon">
              <Icon name="file" />
            </span>
            <span>
              <strong>Precisa de um orçamento?</strong>
              <small>Conte o que aconteceu com seu equipamento.</small>
            </span>
            <Icon name="arrow" size={18} />
          </a>
          <a href={route("acompanhar")} className="contact-option">
            <span className="square-icon">
              <Icon name="search" />
            </span>
            <span>
              <strong>Já tem uma ordem de serviço?</strong>
              <small>Acompanhe cada etapa do seu reparo.</small>
            </span>
            <Icon name="arrow" size={18} />
          </a>
          <div className="contact-photo">
            <img
              src="/assets/workshop.jpg"
              alt="Trabalho de precisão no reparo de uma placa eletrônica"
            />
            <div className="photo-shade" />
            <span className="photo-corner">
              <Icon name="tool" size={24} />
            </span>
            <div className="photo-caption">
              <small>TECNOLOGIA COM CUIDADO</small>
              <strong>
                Do primeiro contato
                <br />à última peça.
              </strong>
            </div>
          </div>
        </aside>
        <div className="form-card">
          {sent ? (
            <div id="contact-success" className="success-view" tabIndex={-1}>
              <span className="success-icon">
                <Icon name="check" size={32} />
              </span>
              <span className="tag">
                {DEMO ? "PRÉVIA INTERATIVA" : "CONTATO REGISTRADO"}
              </span>
              <h2>
                {DEMO ? "Mensagem preparada," : "Mensagem recebida,"}
                <br />
                {sent.name.split(" ")[0]}.
              </h2>
              <p>
                {DEMO
                  ? "Você concluiu o formulário. Nesta demonstração, nenhuma mensagem foi enviada à equipe."
                  : "Sua mensagem foi registrada no sistema e está disponível para consulta pela equipe."}
              </p>
              <div className="review-box">
                <small>ASSUNTO</small>
                <strong>{sent.subject}</strong>
                <small>E-MAIL PARA RETORNO</small>
                <span>{sent.email}</span>
                <small>MENSAGEM</small>
                <p>{sent.message}</p>
              </div>
              <Primary
                onClick={() => {
                  setSent(null);
                  setCount(0);
                }}
              >
                Preparar outra mensagem
              </Primary>
            </div>
          ) : (
            <>
              <div className="form-title">
                <div>
                  <h2>Como podemos ajudar?</h2>
                  <p>Preencha os campos abaixo para iniciar o contato.</p>
                </div>
                <span className="mini-icon">
                  <Icon name="headphones" size={25} />
                </span>
              </div>
              <div className="form-tabs">
                <span className="selected">Dúvidas e informações</span>
                <a href={route("orcamento")}>
                  Solicitar orçamento <Icon name="arrow" size={14} />
                </a>
              </div>
              <form onSubmit={submit} className="contact-form">
                <div className="form-grid">
                  <Field label="Nome completo" required className="span-2">
                    <input
                      id="contact-name"
                      name="name"
                      placeholder="Como podemos chamar você?"
                      autoComplete="name"
                      required
                      minLength={3}
                      maxLength={100}
                    />
                  </Field>
                  <Field label="E-mail" required>
                    <input
                      name="email"
                      type="email"
                      placeholder="voce@exemplo.com"
                      autoComplete="email"
                      required
                      maxLength={150}
                    />
                  </Field>
                  <Field label="Telefone / WhatsApp" required>
                    <input
                      name="phone"
                      type="tel"
                      placeholder="(11) 99999-9999"
                      autoComplete="tel"
                      required
                      pattern="[+0-9() .-]{10,20}"
                      title="Informe um telefone com DDD (10 a 20 caracteres)."
                      maxLength={20}
                    />
                  </Field>
                  <Field label="Assunto" required className="span-2">
                    <select name="subject" defaultValue="" required>
                      <option value="" disabled>
                        Sobre o que você quer conversar?
                      </option>
                      <option>Dúvidas sobre serviços</option>
                      <option>Equipamento e diagnóstico</option>
                      <option>Orçamento e pagamento</option>
                      <option>Acompanhamento de reparo</option>
                      <option>Peças e manutenção</option>
                      <option>Outros assuntos</option>
                    </select>
                  </Field>
                  <Field label="Sua mensagem" required className="span-2">
                    <textarea
                      name="message"
                      placeholder="Conte um pouco sobre o que você precisa..."
                      required
                      minLength={10}
                      maxLength={2000}
                      rows={4}
                      onChange={(e) => setCount(e.target.value.length)}
                    />
                    <span className="char-count">{count}/2.000</span>
                  </Field>
                </div>
                <label className="checkbox">
                  <input type="checkbox" name="consent" required />
                  <span>
                    Concordo com o uso dos meus dados para este atendimento,
                    conforme a{" "}
                    <button
                      type="button"
                      className="inline-link"
                      onClick={openPrivacy}
                    >
                      política de privacidade
                    </button>
                    .
                  </span>
                </label>
                {error && (
                  <p className="error" role="alert">
                    {error}
                  </p>
                )}
                <div className="form-bottom">
                  <small>
                    <Icon name="shield" size={15} /> Não informe senhas ou dados
                    bancários.
                  </small>
                  <Primary type="submit" disabled={busy}>
                    {busy
                      ? "Registrando..."
                      : DEMO
                        ? "Preparar mensagem"
                        : "Enviar mensagem"}
                  </Primary>
                </div>
                {DEMO && (
                  <Notice>
                    Prévia interativa. Este formulário não envia mensagens.
                  </Notice>
                )}
              </form>
            </>
          )}
        </div>
      </section>
      <FAQ />
    </>
  );
}
const services = [
  {
    icon: "laptop",
    title: "Notebooks e computadores",
    desc: "Avaliação de falhas, lentidão, superaquecimento e problemas de inicialização.",
    label: "Hardware e software",
    items: [
      "Diagnóstico de desempenho",
      "Troca de componentes",
      "Limpeza e manutenção",
    ],
  },
  {
    icon: "phone",
    title: "Dispositivos e periféricos",
    desc: "Triagem de equipamentos, acessórios e dispositivos para identificar a origem do problema.",
    label: "Avaliação técnica",
    items: [
      "Registro do equipamento",
      "Inspeção de conexões",
      "Verificação de funcionamento",
    ],
  },
  {
    icon: "tool",
    title: "Manutenção e reparos",
    desc: "Um fluxo organizado, do diagnóstico à escolha das peças e à execução do serviço.",
    label: "Cuidado em cada etapa",
    items: [
      "Diagnóstico detalhado",
      "Orçamento antes do reparo",
      "Testes e entrega",
    ],
  },
  {
    icon: "box",
    title: "Peças e upgrades",
    desc: "Identificação dos componentes necessários para recuperar ou melhorar seu equipamento.",
    label: "Mais vida útil",
    items: [
      "Compatibilidade de peças",
      "Orçamento dos componentes",
      "Instalação e configuração",
    ],
  },
];
function Services() {
  return (
    <>
      <PageIntro
        eyebrow="CUIDADO COM A SUA TECNOLOGIA"
        title={
          <>
            Um problema.
            <br />
            <em>O caminho para resolver.</em>
          </>
        }
        description="Do diagnóstico ao reparo, tudo começa com uma avaliação do seu equipamento."
        breadcrumb="Serviços"
      />
      <section className="container services-grid">
        {services.map((s, i) => (
          <article className="service-card" key={s.title}>
            <div className="service-card-top">
              <span className="square-icon">
                <Icon name={s.icon} size={30} />
              </span>
              <span className="service-num">0{i + 1}</span>
            </div>
            <small className="upper-label">{s.label}</small>
            <h2>{s.title}</h2>
            <p>{s.desc}</p>
            <ul>
              {s.items.map((item) => (
                <li key={item}>
                  <Icon name="check" size={16} />
                  {item}
                </li>
              ))}
            </ul>
            <a href={route("orcamento")} className="text-link">
              Solicitar avaliação <Icon size={18} />
            </a>
          </article>
        ))}
      </section>
      <Process compact />
      <CTABand />
    </>
  );
}
function PageIntro({ eyebrow, title, description, breadcrumb }) {
  return (
    <section className="page-hero">
      <div className="container">
        <Breadcrumb current={breadcrumb} />
        <div className="hero-heading">
          <div>
            <Eyebrow>{eyebrow}</Eyebrow>
            <h1>{title}</h1>
          </div>
          <p>{description}</p>
        </div>
      </div>
      <div className="hero-ring" />
    </section>
  );
}
function Process({ compact = false }) {
  const flow = [
    [
      "file",
      "Você solicita",
      "Informe seus dados, o equipamento e o problema.",
    ],
    [
      "search",
      "A gente avalia",
      "O diagnóstico define o serviço e as peças necessárias.",
    ],
    ["check", "Você aprova", "Veja o orçamento antes de autorizar o reparo."],
    [
      "tool",
      "Seu reparo avança",
      "Acompanhe o andamento até o equipamento estar pronto.",
    ],
  ];
  return (
    <section className={"container process " + (compact ? "compact" : "")}>
      <div className="section-title">
        <div>
          <Eyebrow>SIMPLES DO COMEÇO AO FIM</Eyebrow>
          <h2>
            Você sabe o que acontece.
            <br />
            <em>Em cada etapa.</em>
          </h2>
        </div>
        <p>
          Menos dúvidas. Mais clareza
          <br />
          sobre o cuidado com seu equipamento.
        </p>
      </div>
      <div className="process-grid">
        {flow.map(([icon, title, desc], i) => (
          <article key={title}>
            <span className="process-step">
              <Icon name={icon} size={25} />
              <b>0{i + 1}</b>
            </span>
            <h3>{title}</h3>
            <p>{desc}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
function HowItWorks() {
  return (
    <>
      <PageIntro
        eyebrow="DO CONTATO À ENTREGA"
        title={
          <>
            Clareza para você.
            <br />
            <em>Cuidado com o reparo.</em>
          </>
        }
        description="Conheça o fluxo de atendimento do TechAssist Pro e entenda o próximo passo."
        breadcrumb="Como funciona"
      />
      <Process />
      <section className="container journey-detail">
        <div>
          <span className="tag">ORDEM DE SERVIÇO</span>
          <h2>
            Seu atendimento,
            <br />
            em um só lugar.
          </h2>
          <p>
            O código da ordem conecta os dados do equipamento, o diagnóstico, as
            peças, o orçamento e o histórico do reparo.
          </p>
          <Primary href={route("acompanhar")}>
            Conhecer o acompanhamento
          </Primary>
        </div>
        <div className="stage-preview">
          {stages.map((s, i) => (
            <div key={s} className={i < 3 ? "complete" : ""}>
              <span>
                {i < 2 ? (
                  <Icon name="check" size={15} />
                ) : (
                  String(i + 1).padStart(2, "0")
                )}
              </span>
              <strong>{s}</strong>
              {i === 2 && <small>Você decide</small>}
            </div>
          ))}
        </div>
      </section>
      <FAQ />
    </>
  );
}
function CTABand() {
  return (
    <section className="cta-band">
      <div className="container">
        <div>
          <Eyebrow>VAMOS DAR O PRÓXIMO PASSO?</Eyebrow>
          <h2>
            Sua tecnologia merece
            <br />
            uma nova chance.
          </h2>
        </div>
        <Primary href={route("orcamento")}>Solicitar orçamento</Primary>
      </div>
    </section>
  );
}
function Home() {
  return (
    <>
      <section className="home-hero">
        <img
          src="/assets/workshop.jpg"
          alt="Reparo de precisão de um componente eletrônico"
        />
        <div className="home-overlay" />
        <div className="container">
          <span className="home-label">
            <span />
            ASSISTÊNCIA TÉCNICA, DO INÍCIO AO FIM
          </span>
          <h1>
            Mais vida para
            <br />
            sua tecnologia.
            <br />
            <em>
              Mais tranquilidade
              <br />
              para você.
            </em>
          </h1>
          <p>
            Diagnóstico, peças, orçamento e reparo.
            <br />
            Um atendimento conectado, com você no controle.
          </p>
          <div className="home-actions">
            <Primary href={route("orcamento")}>Solicitar orçamento</Primary>
            <a className="button ghost" href={route("contato")}>
              Entre em contato <Icon size={17} />
            </a>
          </div>
          <div className="hero-benefits">
            <span>
              <Icon name="shield" size={18} />
              Orçamento antes do reparo
            </span>
            <span>
              <Icon name="search" size={18} />
              Acompanhamento por etapa
            </span>
          </div>
        </div>
      </section>
      <div className="home-service-strip container">
        <div>
          <small>TECHASSIST PRO</small>
          <strong>
            Seu equipamento.
            <br />
            Nosso próximo desafio.
          </strong>
        </div>
        {services.slice(0, 3).map((s) => (
          <a href={route("servicos")} key={s.title}>
            <Icon name={s.icon} size={28} />
            <span>{s.title}</span>
            <Icon name="arrow" size={19} />
          </a>
        ))}
      </div>
      <Process />
      <CTABand />
    </>
  );
}
function About() {
  return (
    <>
      <PageIntro
        eyebrow="CONHEÇA O PROJETO"
        title={
          <>
            Tecnologia feita
            <br />
            <em>para simplificar.</em>
          </>
        }
        description="O TechAssist Pro organiza o atendimento de assistência técnica, da entrada do equipamento à entrega."
        breadcrumb="Sobre nós"
      />
      <section className="container about-layout">
        <div className="about-image">
          <img
            src="/assets/workshop.jpg"
            alt="Trabalho técnico em uma placa eletrônica"
          />
          <div className="about-image-label">
            <Icon name="tool" size={32} />
            <span>
              Cuidado técnico.
              <br />
              <b>Gestão inteligente.</b>
            </span>
          </div>
        </div>
        <div>
          <Eyebrow>UMA SOLUÇÃO AUREN</Eyebrow>
          <h2>
            Menos processos soltos.
            <br />
            Mais conexão entre
            <br />
            pessoas e soluções.
          </h2>
          <p>
            O TechAssist Pro é um projeto de gestão de assistência técnica de
            equipamentos. A proposta é reunir clientes, equipamentos,
            diagnósticos, peças, orçamentos e ordens de serviço em um fluxo
            organizado.
          </p>
          <p>
            Para o cliente, clareza sobre o reparo. Para a equipe, informações
            acessíveis para acompanhar cada atendimento.
          </p>
          <div className="about-principles">
            <span>
              <Icon name="check" />
              Transparência no orçamento
            </span>
            <span>
              <Icon name="check" />
              Histórico de cada serviço
            </span>
            <span>
              <Icon name="check" />
              Acompanhamento do equipamento
            </span>
          </div>
          <Primary href={route("contato")}>Converse com a gente</Primary>
        </div>
      </section>
      <section className="container project-team">
        <Eyebrow>QUEM CONSTRÓI O PROJETO</Eyebrow>
        <h2>Uma equipe. O mesmo objetivo.</h2>
        <div className="team-grid">
          {[
            ["Matheus Rodrigues", "Front-end"],
            ["Igor Bosqueiro", "Banco de dados e back-end"],
            ["Igor Matos", "Back-end e banco de dados"],
            ["Filipe Dupin", "Liderança, análise e back-end"],
            ["Italo", "Front-end"],
          ].map(([name, role]) => (
            <div key={name}>
              <span>
                {name
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")}
              </span>
              <strong>{name}</strong>
              <small>{role}</small>
            </div>
          ))}
        </div>
      </section>
      <CTABand />
    </>
  );
}
const blankQuote = {
  name: "",
  email: "",
  phone: "",
  type: "",
  brand: "",
  model: "",
  serial: "",
  service: "Diagnóstico e reparo",
  issue: "",
  consent: false,
};
function Quote({ openPrivacy, onCreated }) {
  const [step, setStep] = useState(0),
    [data, setData] = useState(blankQuote),
    [created, setCreated] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!DEMO) {
      const user = getSession()?.usuario;
      if (user?.tipo === "cliente")
        setData((d) => ({
          ...d,
          name: user.nome,
          email: user.email,
          phone: user.telefone || "",
        }));
    }
  }, []);
  function update(e) {
    setData({
      ...data,
      [e.target.name]:
        e.target.type === "checkbox" ? e.target.checked : e.target.value,
    });
  }
  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    if (step < 2) {
      if (!DEMO && step === 0 && getSession()?.usuario?.tipo !== "cliente") {
        setError(
          "Entre ou crie uma conta de cliente na Área do cliente para continuar.",
        );
        return;
      }
      setError("");
      setStep(step + 1);
      return;
    }
    if (!DEMO) {
      setBusy(true);
      setError("");
      try {
        const kinds = {
          Notebook: "notebook",
          "Computador / desktop": "computador",
          Celular: "celular",
          Tablet: "tablet",
          Impressora: "impressora",
          Monitor: "monitor",
        };
        const result = await api("/solicitacoes", {
          method: "POST",
          body: {
            tipo: kinds[data.type] || "outro",
            marca: data.brand,
            modelo: data.model,
            numero_serie: data.serial,
            defeito_relatado: data.issue,
            servico: data.service,
            consentimento: data.consent,
          },
        });
        const o = { ...data, id: result.codigo_rastreio, dbId: result.id_os };
        setCreated(o);
        setTracking(o);
        onCreated(o);
      } catch (e) {
        setError(e.message);
      } finally {
        setBusy(false);
      }
      return;
    }
    const order = {
      ...data,
      id: makeId(),
      created: new Date().toISOString(),
      stage: 0,
      history: [
        {
          title: "Solicitação registrada nesta prévia",
          note: "Aguardando avaliação técnica. Não há envio para a equipe.",
          date: new Date().toISOString(),
        },
      ],
      parts: [],
      demo: true,
    };
    const list = readOrders();
    if (!saveOrders([...list, order])) {
      setError(
        "Não foi possível salvar neste navegador. Permita o armazenamento local e tente novamente.",
      );
      return;
    }
    setCreated(order);
    onCreated(order);
  }
  return (
    <>
      <PageIntro
        eyebrow="CONTE COM A TECHASSIST"
        breadcrumb="Solicitar orçamento"
        title={
          <>
            O primeiro passo
            <br />
            <em>para resolver.</em>
          </>
        }
        description="Conte o que aconteceu. O diagnóstico é o ponto de partida para definir o serviço e o orçamento."
      />
      <section className="container quote-layout">
        <aside>
          <span className="tag">SOLICITAÇÃO DE AVALIAÇÃO</span>
          <h2>
            Sem adivinhar.
            <br />
            Vamos entender
            <br />o problema.
          </h2>
          <p>
            Quanto mais detalhes você informar, mais claro será o início do
            atendimento.
          </p>
          <div className="quote-tip">
            <Icon name="shield" size={24} />
            <div>
              <strong>Você decide antes do reparo.</strong>
              <p>O valor final depende do diagnóstico e da sua aprovação.</p>
            </div>
          </div>
          {DEMO ? (
            <Notice>
              Demonstração: a solicitação fica apenas neste navegador e não é
              enviada à assistência.
            </Notice>
          ) : (
            <Notice>
              Use sua conta de cliente para solicitar uma avaliação.{" "}
              <a className="inline-link" href={route("area-cliente")}>
                Entrar ou criar conta
              </a>
              .
            </Notice>
          )}
        </aside>
        <div className="form-card quote-card">
          {created ? (
            <div className="success-view" role="status">
              <span className="success-icon">
                <Icon name="check" size={32} />
              </span>
              <h2>Primeiro passo concluído.</h2>
              <p>
                {DEMO
                  ? "Sua solicitação de teste foi salva neste navegador. Use o código e seu e-mail para consultar o acompanhamento da prévia."
                  : "Sua solicitação foi registrada no sistema. Use o código abaixo e seu e-mail para acompanhar o atendimento."}
              </p>
              <div className="ticket-code">
                <small>SEU CÓDIGO DE ACOMPANHAMENTO</small>
                <strong>{created.id}</strong>
              </div>
              <Primary href={route("acompanhar")}>
                Acompanhar solicitação
              </Primary>
              <button
                className="button secondary"
                onClick={() => {
                  setCreated(null);
                  setStep(0);
                  setData(blankQuote);
                }}
              >
                Criar outra solicitação
              </button>
            </div>
          ) : (
            <>
              <div className="wizard-steps">
                {["Seus dados", "Equipamento", "Revisão"].map((s, i) => (
                  <div key={s} className={i <= step ? "active" : ""}>
                    <b>{i < step ? <Icon name="check" size={15} /> : i + 1}</b>
                    <span>{s}</span>
                  </div>
                ))}
              </div>
              <h2>
                {
                  [
                    "Vamos nos conhecer.",
                    "Qual equipamento precisa de cuidado?",
                    "Tudo certo para continuar?",
                  ][step]
                }
              </h2>
              <p className="step-description">
                {
                  [
                    "Informe os dados para identificar seu atendimento.",
                    "Descreva o equipamento e o que está acontecendo.",
                    "Confira as informações antes de registrar sua solicitação.",
                  ][step]
                }
              </p>
              <form onSubmit={submit}>
                {!DEMO && step === 0 && (
                  <Notice>
                    Já tem uma conta?{" "}
                    <a className="inline-link" href={route("area-cliente")}>
                      Entre ou cadastre-se antes de continuar.
                    </a>
                  </Notice>
                )}
                <div className="form-grid">
                  {step === 0 ? (
                    <>
                      <Field label="Nome completo" required className="span-2">
                        <input
                          autoComplete="name"
                          name="name"
                          value={data.name}
                          onChange={update}
                          required
                          minLength={3}
                          maxLength={100}
                          placeholder="Seu nome completo"
                        />
                      </Field>
                      <Field label="E-mail" required className="span-2">
                        <input
                          autoComplete="email"
                          name="email"
                          type="email"
                          value={data.email}
                          onChange={update}
                          required
                          maxLength={150}
                          placeholder="voce@exemplo.com"
                        />
                      </Field>
                      <Field
                        label="Telefone / WhatsApp"
                        required
                        className="span-2"
                      >
                        <input
                          autoComplete="tel"
                          name="phone"
                          type="tel"
                          value={data.phone}
                          onChange={update}
                          required
                          pattern="[+0-9() .-]{10,20}"
                          title="Informe um telefone com DDD."
                          maxLength={20}
                          placeholder="(11) 99999-9999"
                        />
                      </Field>
                    </>
                  ) : step === 1 ? (
                    <>
                      <Field label="Tipo de equipamento" required>
                        <select
                          name="type"
                          value={data.type}
                          onChange={update}
                          required
                        >
                          <option value="" disabled>
                            Selecione
                          </option>
                          {[
                            "Notebook",
                            "Computador / desktop",
                            "Celular",
                            "Tablet",
                            "Impressora",
                            "Monitor",
                            "Periférico",
                            "Outro equipamento",
                          ].map((x) => (
                            <option key={x}>{x}</option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Serviço desejado" required>
                        <select
                          name="service"
                          value={data.service}
                          onChange={update}
                        >
                          {[
                            "Diagnóstico e reparo",
                            "Manutenção preventiva",
                            "Troca de peças / upgrade",
                            "Instalação / configuração",
                            "Não sei, preciso de avaliação",
                          ].map((x) => (
                            <option key={x}>{x}</option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Marca" required>
                        <input
                          name="brand"
                          value={data.brand}
                          onChange={update}
                          required
                          maxLength={60}
                          placeholder="Ex.: Dell, Samsung, HP"
                        />
                      </Field>
                      <Field label="Modelo" required>
                        <input
                          name="model"
                          value={data.model}
                          onChange={update}
                          required
                          maxLength={80}
                          placeholder="Ex.: Inspiron 15"
                        />
                      </Field>
                      <Field
                        label="Número de série"
                        className="span-2"
                        hint="Opcional. Informe se estiver disponível."
                      >
                        <input
                          name="serial"
                          value={data.serial}
                          onChange={update}
                          maxLength={100}
                          placeholder="Número de identificação do equipamento"
                        />
                      </Field>
                      <Field
                        label="Descrição do problema"
                        required
                        className="span-2"
                      >
                        <textarea
                          name="issue"
                          value={data.issue}
                          onChange={update}
                          required
                          minLength={10}
                          maxLength={2000}
                          rows={4}
                          placeholder="O que aconteceu? Quando começou? Há alguma mensagem de erro?"
                        />
                      </Field>
                    </>
                  ) : (
                    <div className="review-box span-2">
                      <small>CONTATO</small>
                      <strong>{data.name}</strong>
                      <span>
                        {data.email} · {data.phone}
                      </span>
                      <small>EQUIPAMENTO</small>
                      <strong>
                        {data.type} · {data.brand} {data.model}
                      </strong>
                      {data.serial && <span>Série: {data.serial}</span>}
                      <small>SERVIÇO</small>
                      <span>{data.service}</span>
                      <small>PROBLEMA RELATADO</small>
                      <p>{data.issue}</p>
                    </div>
                  )}
                </div>
                {step === 2 && (
                  <label className="checkbox">
                    <input
                      name="consent"
                      type="checkbox"
                      required
                      checked={data.consent}
                      onChange={update}
                    />
                    <span>
                      {DEMO
                        ? "Entendo que esta solicitação é uma demonstração, salva neste navegador, conforme a "
                        : "Concordo com o uso dos meus dados para registrar e acompanhar este atendimento, conforme a "}
                      <button
                        type="button"
                        className="inline-link"
                        onClick={openPrivacy}
                      >
                        política de privacidade
                      </button>
                      .
                    </span>
                  </label>
                )}
                {error && (
                  <p className="error" role="alert">
                    {error}
                  </p>
                )}
                <div className="wizard-actions">
                  {step > 0 ? (
                    <button
                      type="button"
                      className="button secondary"
                      onClick={() => setStep(step - 1)}
                    >
                      Voltar
                    </button>
                  ) : (
                    <small>* Campos obrigatórios</small>
                  )}
                  <Primary type="submit" disabled={busy}>
                    {busy
                      ? "Registrando..."
                      : step === 2
                        ? DEMO
                          ? "Salvar solicitação de teste"
                          : "Registrar solicitação"
                        : "Continuar"}
                  </Primary>
                </div>
              </form>
            </>
          )}
        </div>
      </section>
    </>
  );
}
function OrderDetail({ order, onUpdate, onDecision }) {
  const [tab, setTab] = useState("resumo"),
    [confirm, setConfirm] = useState(null),
    [decisionError, setDecisionError] = useState(""),
    [busy, setBusy] = useState(false);
  const total = order.parts?.reduce((v, p) => v + p.value * p.qty, 0) || 0;
  const status =
    order.decision === "recusado"
      ? "Orçamento recusado"
      : order.statusLabel ||
        (order.stage === 2 ? "Aguardando aprovação" : stages[order.stage]);
  async function decide(value) {
    if (busy) return;
    if (onDecision) {
      setBusy(true);
      setDecisionError("");
      try {
        onUpdate(await onDecision(value));
        setConfirm(null);
      } catch (e) {
        setDecisionError(e.message);
      } finally {
        setBusy(false);
      }
      return;
    }
    const next = {
      ...order,
      decision: value,
      stage: value === "aprovado" ? 3 : 2,
      history: [
        ...order.history,
        {
          title:
            value === "aprovado"
              ? "Orçamento aprovado na demonstração"
              : "Orçamento recusado na demonstração",
          note:
            value === "aprovado"
              ? "O fluxo de exemplo avança para a etapa de reparo."
              : "A equipe deverá conversar com o cliente antes de continuar.",
          date: new Date().toISOString(),
        },
      ],
    };
    onUpdate(next);
    setConfirm(null);
  }
  return (
    <section className="order-detail">
      <div className="order-top">
        <div>
          <span className="tag">
            {DEMO ? "ORDEM DE SERVIÇO · DEMONSTRAÇÃO" : "ORDEM DE SERVIÇO"}
          </span>
          <h2>{order.id}</h2>
          <p>
            {order.type} · {order.brand} {order.model}
          </p>
        </div>
        <span className={"status-pill " + (order.stage === 3 ? "green" : "")}>
          {status}
        </span>
      </div>
      <div className="order-progress">
        {stages.map((s, i) => (
          <div className={i <= order.stage ? "active" : ""} key={s}>
            <span>
              {i < order.stage ? <Icon name="check" size={14} /> : i + 1}
            </span>
            <small>{s}</small>
          </div>
        ))}
      </div>
      <div
        className="detail-tabs"
        role="tablist"
        aria-label="Detalhes da ordem"
      >
        {[
          ["resumo", "Equipamento"],
          ["diagnostico", "Diagnóstico e peças"],
          ["historico", "Histórico"],
        ].map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            className={tab === id ? "selected" : ""}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="order-tab-content" role="tabpanel">
        {tab === "resumo" ? (
          <>
            <div className="equipment-grid">
              <div>
                <small>TIPO</small>
                <strong>{order.type}</strong>
              </div>
              <div>
                <small>MARCA / MODELO</small>
                <strong>
                  {order.brand} {order.model}
                </strong>
              </div>
              <div>
                <small>NÚMERO DE SÉRIE</small>
                <strong>{order.serial || "Não informado"}</strong>
              </div>
              <div>
                <small>ABERTURA</small>
                <strong>{date(order.created)}</strong>
              </div>
            </div>
            <div className="issue-box">
              <small>PROBLEMA RELATADO</small>
              <p>{order.issue}</p>
            </div>
            <Notice>
              {DEMO
                ? order.stage === 0
                  ? "A solicitação foi criada apenas nesta prévia. A avaliação técnica ainda não foi realizada."
                  : "Esta ordem é um exemplo interativo para visualizar o fluxo de atendimento."
                : order.stage === 0
                  ? "Solicitação recebida. Aguardando avaliação técnica."
                  : "Consulte as abas para ver diagnóstico, orçamento e histórico do atendimento."}
            </Notice>
          </>
        ) : tab === "diagnostico" ? (
          <>
            <h3>Avaliação técnica</h3>
            <p>
              {order.diagnosis ||
                "Aguardando avaliação técnica. O diagnóstico e o orçamento serão exibidos nesta etapa."}
            </p>
            {(order.parts?.length > 0 || order.raw?.orcamento) && (
              <>
                <div className="parts-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Peça ou serviço</th>
                        <th>Qtd.</th>
                        <th>Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.parts.map((p) => (
                        <tr key={p.name}>
                          <td>{p.name}</td>
                          <td>{p.qty}</td>
                          <td>{money(p.value * p.qty)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="2">
                          {DEMO
                            ? "Total do orçamento de exemplo"
                            : "Total do orçamento"}
                        </td>
                        <td>{money(total)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                {!order.decision ? (
                  <>
                    <p className="quote-decision-note">
                      {DEMO
                        ? "Os valores são ilustrativos. Teste a aprovação ou a recusa do orçamento."
                        : "Confira o diagnóstico e os valores antes de autorizar o reparo."}
                    </p>
                    <div className="approval-actions">
                      <Primary onClick={() => setConfirm("aprovado")}>
                        {DEMO
                          ? "Aprovar orçamento de teste"
                          : "Aprovar orçamento"}
                      </Primary>
                      <button
                        className="button secondary"
                        onClick={() => setConfirm("recusado")}
                      >
                        Recusar
                      </button>
                    </div>
                    {confirm && (
                      <div className="confirmation" role="alert">
                        <strong>
                          {confirm === "aprovado"
                            ? "Aprovar este orçamento?"
                            : "Recusar este orçamento?"}
                        </strong>
                        <p>
                          {DEMO
                            ? "A alteração afeta apenas a demonstração neste navegador."
                            : "A decisão será registrada no histórico desta ordem de serviço."}
                        </p>
                        <div>
                          <button
                            className="button primary"
                            disabled={busy}
                            onClick={() => decide(confirm)}
                          >
                            Confirmar{" "}
                            {confirm === "aprovado" ? "aprovação" : "recusa"}
                          </button>
                          <button
                            className="button secondary"
                            onClick={() => setConfirm(null)}
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <Notice>
                    Orçamento{" "}
                    {order.decision === "aprovado" ? "aprovado" : "recusado"}
                    {DEMO ? " nesta demonstração." : "."}
                  </Notice>
                )}
              </>
            )}
          </>
        ) : (
          <ol className="history-list">
            {[...order.history].reverse().map((h, i) => (
              <li key={i}>
                <span>
                  <Icon name={i === 0 ? "clock" : "check"} size={16} />
                </span>
                <div>
                  <small>{date(h.date)}</small>
                  <strong>{h.title}</strong>
                  <p>{h.note}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
        {decisionError && (
          <p className="error" role="alert">
            {decisionError}
          </p>
        )}
      </div>
    </section>
  );
}
function Tracking({ lastOrder }) {
  const [code, setCode] = useState(
      lastOrder?.id || (!DEMO ? getTracking()?.id : "") || "",
    ),
    [email, setEmail] = useState(
      lastOrder?.email || (!DEMO ? getTracking()?.email : "") || "",
    ),
    [found, setFound] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function search(e) {
    e.preventDefault();
    if (busy) return;
    if (!DEMO) {
      setBusy(true);
      setError("");
      try {
        const o = await api("/rastreio", {
          method: "POST",
          body: { codigo: code, email },
        });
        setFound(mapOrder(o));
      } catch (e) {
        setFound(null);
        setError(e.message);
      } finally {
        setBusy(false);
      }
      return;
    }
    const all = readOrders();
    let demo = sample;
    try {
      demo =
        JSON.parse(localStorage.getItem("tap-sample-order") || "null") ||
        sample;
    } catch {}
    const order = [...all, demo].find(
      (o) =>
        o.id.toUpperCase() === code.trim().toUpperCase() &&
        o.email.toLowerCase() === email.trim().toLowerCase(),
    );
    if (order) {
      setFound(order);
      setError("");
    } else {
      setFound(null);
      setError(
        "Não encontramos uma solicitação com esse código e e-mail neste navegador. Confira os dados ou abra a ordem de exemplo.",
      );
    }
  }
  function showDemo() {
    let demo = sample;
    try {
      demo =
        JSON.parse(localStorage.getItem("tap-sample-order") || "null") ||
        sample;
    } catch {}
    setCode(demo.id);
    setEmail(demo.email);
    setFound(demo);
    setError("");
  }
  function update(next) {
    setFound(next);
    if (next.id === sample.id) {
      try {
        localStorage.setItem("tap-sample-order", JSON.stringify(next));
      } catch {}
    } else {
      saveOrders(readOrders().map((o) => (o.id === next.id ? next : o)));
    }
  }
  return (
    <>
      <PageIntro
        eyebrow="CADA ETAPA, MAIS PERTO DE VOCÊ"
        breadcrumb="Acompanhar reparo"
        title={
          <>
            Como está
            <br />
            <em>o seu equipamento?</em>
          </>
        }
        description="Consulte sua ordem de serviço e veja o diagnóstico, o orçamento e o histórico do reparo."
      />
      <section className="container tracking-layout">
        <div className="tracking-search">
          <div>
            <span className="square-icon">
              <Icon name="search" size={28} />
            </span>
            <h2>Acompanhe seu reparo</h2>
            <p>Informe o código da ordem e o e-mail da solicitação.</p>
          </div>
          <form onSubmit={search}>
            <Field label="Código da ordem" required>
              <input
                name="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ex.: TAP-2026-001"
                required
                maxLength={50}
                autoCapitalize="characters"
              />
            </Field>
            <Field label="E-mail da solicitação" required>
              <input
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@exemplo.com"
                required
                maxLength={150}
              />
            </Field>
            <Primary type="submit" disabled={busy}>
              {busy ? "Consultando..." : "Consultar ordem"}
            </Primary>
          </form>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          {DEMO && (
            <div className="demo-try">
              <span>Quer conhecer o acompanhamento?</span>
              <button onClick={showDemo} className="text-link">
                Ver ordem de exemplo <Icon size={16} />
              </button>
            </div>
          )}
          {DEMO && (
            <Notice>
              Prévia: consultas e alterações usam somente dados deste navegador.
            </Notice>
          )}
        </div>
        {found ? (
          <OrderDetail
            order={found}
            onUpdate={DEMO ? update : setFound}
            onDecision={
              DEMO
                ? undefined
                : async (decisao) =>
                    mapOrder(
                      await api("/rastreio/decisao", {
                        method: "POST",
                        body: { codigo: code, email, decisao },
                      }),
                    )
            }
          />
        ) : (
          <div className="tracking-empty">
            <div className="tracking-illustration">
              <Icon name="laptop" size={88} />
              <span>
                <Icon name="check" size={27} />
              </span>
            </div>
            <span className="tag">DO DIAGNÓSTICO À ENTREGA</span>
            <h2>Sem ficar no escuro.</h2>
            <p>
              Veja o status do equipamento, entenda o diagnóstico e acompanhe
              cada movimentação da ordem.
            </p>
            <div className="empty-feature">
              <Icon name="file" />
              <span>Diagnóstico e orçamento</span>
              <Icon name="clock" />
              <span>Histórico de atualizações</span>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
function ClientArea({ onView }) {
  const [orders, setOrders] = useState([]),
    [remove, setRemove] = useState(null);
  useEffect(() => setOrders(readOrders()), []);
  function deleteOrder(id) {
    const list = orders.filter((o) => o.id !== id);
    if (saveOrders(list)) {
      setOrders(list);
      setRemove(null);
    }
  }
  function download(o) {
    const text = `TECHASSIST PRO — SOLICITAÇÃO DE TESTE\n\nCódigo: ${o.id}\nData: ${date(o.created)}\nCliente: ${o.name}\nE-mail: ${o.email}\nTelefone: ${o.phone}\nEquipamento: ${o.type} — ${o.brand} ${o.model}\nSérie: ${o.serial || "Não informado"}\nServiço: ${o.service}\nProblema: ${o.issue}\nStatus: ${stages[o.stage]}\n\nDemonstração. Nenhuma solicitação foi enviada à equipe.`;
    const url = URL.createObjectURL(
      new Blob([text], { type: "text/plain;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `${o.id}.txt`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <>
      <PageIntro
        eyebrow="SUA CENTRAL DE ATENDIMENTO"
        breadcrumb="Área do cliente"
        title={
          <>
            Seu atendimento.
            <br />
            <em>Mais organizado.</em>
          </>
        }
        description="Veja as solicitações de teste criadas neste navegador e acesse o acompanhamento."
      />
      <section className="container client-section">
        <div className="client-header">
          <div>
            <h2>
              Minhas solicitações{" "}
              <span className="count-badge">{orders.length}</span>
            </h2>
            <p>
              Prévia local, sem autenticação. Nenhum dado é compartilhado com a
              assistência.
            </p>
          </div>
          <Primary href={route("orcamento")}>Nova solicitação</Primary>
        </div>
        {orders.length ? (
          <div className="requests-list">
            {orders.map((o) => (
              <article key={o.id}>
                <span className="square-icon">
                  <Icon
                    name={o.type.includes("phone") ? "phone" : "laptop"}
                    size={27}
                  />
                </span>
                <div className="request-name">
                  <small>{o.id}</small>
                  <h3>
                    {o.brand} {o.model}
                  </h3>
                  <p>
                    {o.service} · {date(o.created)}
                  </p>
                </div>
                <span className="status-pill">{stages[o.stage]}</span>
                <div className="request-actions">
                  <button
                    className="button secondary"
                    onClick={() => onView(o)}
                  >
                    Ver detalhes <Icon size={16} />
                  </button>
                  <button
                    className="icon-button"
                    aria-label={"Baixar solicitação " + o.id}
                    title="Baixar solicitação"
                    onClick={() => download(o)}
                  >
                    <Icon name="download" size={19} />
                  </button>
                  <button
                    className="icon-button"
                    aria-label={"Apagar solicitação " + o.id}
                    title="Apagar solicitação"
                    onClick={() => setRemove(o.id)}
                  >
                    <Icon name="trash" size={19} />
                  </button>
                </div>
                {remove === o.id && (
                  <div className="delete-confirm" role="alert">
                    <span>
                      Apagar esta solicitação de teste deste navegador?
                    </span>
                    <button
                      className="button primary"
                      onClick={() => deleteOrder(o.id)}
                    >
                      Apagar
                    </button>
                    <button
                      className="button secondary"
                      onClick={() => setRemove(null)}
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="client-empty">
            <span className="square-icon">
              <Icon name="file" size={38} />
            </span>
            <h2>
              Seu próximo atendimento
              <br />
              começa por aqui.
            </h2>
            <p>
              Você ainda não criou uma solicitação de teste neste navegador.
            </p>
            <Primary href={route("orcamento")}>Solicitar avaliação</Primary>
            <a className="text-link" href={route("acompanhar")}>
              Conhecer o acompanhamento <Icon size={16} />
            </a>
          </div>
        )}
      </section>
    </>
  );
}
export default function TechAssist({ initialPage = "contato", initialAuthMode = null }) {
  const [page, setPage] = useState(initialPage),
    [mobile, setMobile] = useState(false),
    [privacy, setPrivacy] = useState(false),
    [authMode, setAuthMode] = useState(initialAuthMode),
    [lastOrder, setLastOrder] = useState(null);
  useEffect(() => {
    function change() {
      const raw =
        decodeURIComponent(window.location.hash.replace("#", "")) ||
        initialPage;
      if (raw === "main-content") return;
      setPage(validPages.includes(raw) ? raw : initialPage);
      setMobile(false);
      window.scrollTo({ top: 0, behavior: "instant" });
    }
    change();
    window.addEventListener("hashchange", change);
    return () => window.removeEventListener("hashchange", change);
  }, []);
  useEffect(() => {
    const titles = {
      inicio: "Início",
      servicos: "Serviços",
      "como-funciona": "Como funciona",
      sobre: "Sobre nós",
      contato: "Contato",
      orcamento: "Solicitar orçamento",
      acompanhar: "Acompanhar reparo",
      "area-cliente": "Área do cliente",
    };
    document.title = titles[page] + " | TechAssist Pro";
  }, [page]);
  function abrirArea() {
    setMobile(false);
    const sessao = getSession();
    if (sessao?.token) window.location.assign("/dashboard");
    else setAuthMode("login");
  }
  function autenticar(sessao) {
    setSession(sessao);
    setAuthMode(null);
    window.location.assign("/dashboard");
  }
  function viewOrder(o) {
    setLastOrder(o);
    if (DEMO) location.hash = "acompanhar";
    else {
      setTracking(o);
      location.href = route("acompanhar");
    }
  }
  return (
    <>
      <a className="skip-link" href="#main-content">
        Pular para o conteúdo
      </a>
      <div className="topbar">
        <div className="container">
          <span>
            <span className="tiny-dot" />
            Tecnologia com cuidado. Atendimento com clareza.
          </span>
          <a href={route("acompanhar")}>
            Já tem uma ordem de serviço? Acompanhe <Icon size={13} />
          </a>
        </div>
      </div>
      <header>
        <div className="container header-inner">
          <nav className={mobile ? "open" : ""} aria-label="Menu principal">
            {nav.map(([id, label]) => (
              <a
                href={route(id)}
                key={id}
                aria-current={page === id ? "page" : undefined}
                className={page === id ? "active" : ""}
              >
                {label}
              </a>
            ))}
            <button type="button" className="mobile-area" onClick={abrirArea}>
              Área do cliente
            </button>
          </nav>
          <button
            type="button"
            className={
              "client-button " + (page === "area-cliente" ? "active" : "")
            }
            onClick={abrirArea}
          >
            <Icon name="user" size={17} />
            <span>Área do cliente</span>
            <Icon size={15} />
          </button>
          <button
            className="menu-button"
            aria-expanded={mobile}
            aria-label={mobile ? "Fechar menu" : "Abrir menu"}
            onClick={() => setMobile(!mobile)}
          >
            <Icon name={mobile ? "close" : "menu"} size={25} />
          </button>
        </div>
      </header>
      <main id="main-content" tabIndex={-1} key={page}>
        {page === "contato" ? (
          <Contact openPrivacy={() => setPrivacy(true)} />
        ) : page === "inicio" ? (
          <Home />
        ) : page === "servicos" ? (
          <Services />
        ) : page === "como-funciona" ? (
          <HowItWorks />
        ) : page === "sobre" ? (
          <About />
        ) : page === "orcamento" ? (
          <Quote
            openPrivacy={() => setPrivacy(true)}
            onCreated={setLastOrder}
          />
        ) : page === "acompanhar" ? (
          <Tracking lastOrder={lastOrder} />
        ) : DEMO ? (
          <ClientArea onView={viewOrder} />
        ) : (
          <LiveArea />
        )}
      </main>
      <footer>
        <div className="container footer-main">
          <div>
            <p>
              Gestão inteligente.
              <br />
              Cuidado em cada reparo.
            </p>
          </div>
          <div>
            <small>EXPLORE</small>
            <a href={route("inicio")}>Início</a>
            <a href={route("servicos")}>Nossos serviços</a>
            <a href={route("sobre")}>Sobre o TechAssist Pro</a>
          </div>
          <div>
            <small>PODEMOS AJUDAR?</small>
            <a href={route("contato")}>Entre em contato</a>
            <a href={route("orcamento")}>Solicitar orçamento</a>
            <a href={route("acompanhar")}>Acompanhar reparo</a>
          </div>
          <div className="footer-note">
            <span className="footer-symbol">
              <Icon name="tool" size={28} />
            </span>
            <strong>
              Sua tecnologia,
              <br />
              em boas etapas.
            </strong>
            <span>Do diagnóstico à entrega.</span>
          </div>
        </div>
        <div className="container footer-bottom">
          <span>
            © {new Date().getFullYear()} TechAssist Pro · Projeto Auren
          </span>
          <span>{DEMO ? "Prévia interativa" : "Atendimento conectado"}</span>
          <button onClick={() => setPrivacy(true)}>
            Privacidade <Icon size={13} />
          </button>
        </div>
      </footer>
      {privacy && <Privacy onClose={() => setPrivacy(false)} />}
      {authMode && <AuthModal initialMode={authMode} onClose={() => setAuthMode(null)} onAuthenticated={autenticar} />}
    </>
  );
}

export {
  Icon,
  Primary,
  Field,
  Notice,
  PageIntro,
  OrderDetail,
  money,
  date,
};
