import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const RESEND_KEY = Deno.env.get("RESEND_API_KEY")!
const UAZAPI_URL = Deno.env.get("UAZAPI_URL") ?? "https://btechsoutoshop.uazapi.com"
const UAZAPI_TOKEN = Deno.env.get("UAZAPI_TOKEN")!
const UAZAPI_INSTANCE = Deno.env.get("UAZAPI_INSTANCE") ?? "556193988147"
const DELAY_MS = 1500

function applyVars(text: string, dados: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, k) => dados[k] || dados[k.toLowerCase()] || "")
}

function formatPhone(tel: string): string {
  const digits = tel.replace(/\D/g, "")
  if (digits.startsWith("55") && digits.length >= 12) return digits
  if (digits.length === 11 || digits.length === 10) return "55" + digits
  if (digits.length >= 10) return "55" + digits
  return digits
}

async function sendEmail(to: string, from: string, subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_KEY}` },
    body: JSON.stringify({ from, to: [to], subject, html }),
  })
  if (!res.ok) throw new Error(await res.text())
}

async function sendWhatsApp(telefone: string, text: string) {
  const jid = formatPhone(telefone) + "@s.whatsapp.net"
  const res = await fetch(`${UAZAPI_URL}/message/sendText/${UAZAPI_INSTANCE}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", token: UAZAPI_TOKEN },
    body: JSON.stringify({ number: jid, text }),
  })
  if (!res.ok) throw new Error(await res.text())
}

Deno.serve(async (req: Request) => {
  const { campanha_id } = await req.json()
  if (!campanha_id) return new Response("campanha_id required", { status: 400 })

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  )

  const { data: camp } = await supabase.from("bp_campanhas").select("*, bp_templates(*)").eq("id", campanha_id).single()
  if (!camp) return new Response("Campanha não encontrada", { status: 404 })

  const tpl = camp.bp_templates
  if (!tpl) return new Response("Template não encontrado", { status: 404 })

  // Mark as sending
  await supabase.from("bp_campanhas").update({ status: "sending", iniciado_at: new Date().toISOString() }).eq("id", campanha_id)

  const { data: contatos } = await supabase.from("bp_contatos").select("*").eq("campanha_id", campanha_id).eq("status", "pending")

  let enviados = 0
  let falhas = 0

  for (const contato of contatos ?? []) {
    const dados = { ...contato.dados, nome: contato.nome ?? "", email: contato.email ?? "", telefone: contato.telefone ?? "" }
    let ok = false
    let erro: string | null = null

    try {
      if (camp.tipo === "email") {
        if (!contato.email) throw new Error("Email não informado")
        const subject = applyVars(tpl.assunto ?? "(sem assunto)", dados)
        const html = applyVars(tpl.conteudo, dados)
        await sendEmail(contato.email, "BTechSouto <noreply@btechsouto.shop>", subject, html)
      } else {
        if (!contato.telefone) throw new Error("Telefone não informado")
        const text = applyVars(tpl.conteudo, dados)
        await sendWhatsApp(contato.telefone, text)
      }
      ok = true
    } catch (e) {
      erro = e instanceof Error ? e.message : String(e)
    }

    await supabase.from("bp_contatos").update({
      status: ok ? "sent" : "failed",
      erro: erro,
      enviado_at: ok ? new Date().toISOString() : null,
    }).eq("id", contato.id)

    if (ok) enviados++; else falhas++

    // Update counters after each send
    await supabase.from("bp_campanhas").update({ total_enviados: enviados, total_falhas: falhas }).eq("id", campanha_id)

    if (DELAY_MS > 0) await new Promise(r => setTimeout(r, DELAY_MS))
  }

  await supabase.from("bp_campanhas").update({
    status: "completed",
    total_enviados: enviados,
    total_falhas: falhas,
    concluido_at: new Date().toISOString(),
  }).eq("id", campanha_id)

  return new Response(JSON.stringify({ ok: true, enviados, falhas }), {
    headers: { "Content-Type": "application/json" },
  })
})
