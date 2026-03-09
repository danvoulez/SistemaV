import Anthropic from '@anthropic-ai/sdk';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY ?? ''
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id, role, full_name')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const body = await request.json();
    const { messages, context } = body as {
      messages: Array<{ role: 'user' | 'assistant'; content: string }>;
      context?: string;
    };

    // Fetch business context for the tenant
    const tenantId = profile.tenant_id;
    const [
      { data: orders },
      { data: deliveries },
      { data: tasks },
      { data: financeEntries },
      { data: people },
      { data: inventory }
    ] = await Promise.all([
      supabase
        .from('sales_orders')
        .select('id, order_number, status, total_amount, payment_status, created_at')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('deliveries')
        .select('id, status, delivery_type, scheduled_for')
        .eq('tenant_id', tenantId)
        .neq('status', 'delivered')
        .limit(20),
      supabase
        .from('tasks')
        .select('id, title, status, priority, due_date')
        .eq('tenant_id', tenantId)
        .neq('status', 'done')
        .limit(20),
      supabase
        .from('finance_entries')
        .select('id, type, amount, occurred_at, description')
        .eq('tenant_id', tenantId)
        .order('occurred_at', { ascending: false })
        .limit(30),
      supabase
        .from('people')
        .select('id, full_name, type, is_active')
        .eq('tenant_id', tenantId)
        .limit(20),
      supabase
        .from('inventory_balances')
        .select('id, quantity_available, quantity_on_hand')
        .eq('tenant_id', tenantId)
        .lte('quantity_available', 0)
        .limit(10)
    ]);

    // Build business summary
    const totalRevenue = (financeEntries ?? [])
      .filter((e) => e.type === 'income')
      .reduce((s, e) => s + Number(e.amount), 0);
    const totalExpense = (financeEntries ?? [])
      .filter((e) => e.type === 'expense')
      .reduce((s, e) => s + Number(e.amount), 0);

    const businessContext = `
Você é um assistente de negócios inteligente para o sistema SistemaV.
Você tem acesso aos dados em tempo real do negócio do usuário.
Responda sempre em Português do Brasil.
Seja direto, profissional e útil.

=== DADOS DO NEGÓCIO (ATUAIS) ===

PEDIDOS (últimos 20):
${(orders ?? []).map((o) => `- ${o.order_number}: status=${o.status}, pagamento=${o.payment_status}, valor=R$${Number(o.total_amount).toFixed(2)}, data=${new Date(o.created_at).toLocaleDateString('pt-BR')}`).join('\n') || 'Nenhum pedido'}

ENTREGAS PENDENTES (${(deliveries ?? []).length} total):
${(deliveries ?? []).map((d) => `- Entrega ${d.id.slice(0, 8)}: status=${d.status}, tipo=${d.delivery_type}, agendado=${d.scheduled_for ? new Date(d.scheduled_for).toLocaleDateString('pt-BR') : 'não definido'}`).join('\n') || 'Nenhuma entrega pendente'}

TAREFAS ABERTAS (${(tasks ?? []).length} total):
${(tasks ?? []).map((t) => `- [${t.priority}] ${t.title}: status=${t.status}, vencimento=${t.due_date ? new Date(t.due_date).toLocaleDateString('pt-BR') : 'sem data'}`).join('\n') || 'Nenhuma tarefa aberta'}

RESUMO FINANCEIRO (últimos registros):
- Total Receitas: R$${totalRevenue.toFixed(2)}
- Total Despesas: R$${totalExpense.toFixed(2)}
- Saldo Líquido: R$${(totalRevenue - totalExpense).toFixed(2)}

CADASTRO DE PESSOAS: ${(people ?? []).length} pessoas (${(people ?? []).filter((p) => p.is_active).length} ativas)

ESTOQUE: ${(inventory ?? []).length} item(s) com estoque zero ou negativo

${context ? `\nCONTEXTO ADICIONAL:\n${context}` : ''}

=== FIM DOS DADOS ===

Usuário logado: ${profile.full_name} (role: ${profile.role})
`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: businessContext,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content
      }))
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    return NextResponse.json({
      message: content.text,
      usage: response.usage
    });
  } catch (error) {
    console.error('AI route error:', error);
    return NextResponse.json(
      { error: 'Erro ao processar sua mensagem. Tente novamente.' },
      { status: 500 }
    );
  }
}

// Streaming endpoint
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const message = searchParams.get('q');

  if (!message) {
    return NextResponse.json({ error: 'Missing query parameter' }, { status: 400 });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id, full_name, role')
      .eq('id', user.id)
      .single();

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await anthropic.messages.stream({
            model: 'claude-sonnet-4-6',
            max_tokens: 1024,
            system: `Você é um assistente de negócios para o SistemaV. Responda em Português do Brasil. Usuário: ${profile?.full_name} (${profile?.role}).`,
            messages: [{ role: 'user', content: message }]
          });

          for await (const chunk of response) {
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive'
      }
    });
  } catch (error) {
    console.error('Streaming error:', error);
    return NextResponse.json({ error: 'Stream error' }, { status: 500 });
  }
}
