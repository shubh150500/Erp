import { Phone, Mail } from "lucide-react";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageTitle, Panel, EmptyState } from "@/components/erp/ui";
import { StatusSelect } from "./StatusSelect";

export const metadata = { title: "Admissions" };

export default async function AdmissionsPage() {
  await requireRole(["ADMIN"]);
  
  let inquiries: any[] = [];
  try {
    inquiries = await prisma.inquiry.findMany({
      orderBy: { createdAt: "desc" },
    }).catch(() => []);
  } catch (err) {
    console.error("Admissions query failed:", err);
  }

  return (
    <>
      <PageTitle
        title="Admission Enquiries"
        subtitle="Leads submitted through the website contact form."
      />
      <Panel>
        {inquiries.length === 0 ? (
          <EmptyState message="No enquiries yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-navy-400 border-b border-navy-100">
                  <th className="px-5 py-3 font-semibold">Name</th>
                  <th className="px-5 py-3 font-semibold">Contact</th>
                  <th className="px-5 py-3 font-semibold">Class</th>
                  <th className="px-5 py-3 font-semibold">Message</th>
                  <th className="px-5 py-3 font-semibold">Received</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100">
                {inquiries.map((q) => (
                  <tr key={q.id} className="hover:bg-ivory/40">
                    <td className="px-5 py-3.5 font-medium text-navy-700">{q.name}</td>
                    <td className="px-5 py-3.5 text-navy-600">
                      <a href={`tel:${q.phone}`} className="flex items-center gap-1.5 hover:text-gold-600">
                        <Phone size={13} /> {q.phone}
                      </a>
                      {q.email && (
                        <a href={`mailto:${q.email}`} className="flex items-center gap-1.5 text-xs text-navy-400 hover:text-gold-600">
                          <Mail size={12} /> {q.email}
                        </a>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-navy-600">{q.className}</td>
                    <td className="px-5 py-3.5 text-navy-500 max-w-xs truncate">
                      {q.message || "—"}
                    </td>
                    <td className="px-5 py-3.5 text-navy-500 whitespace-nowrap">
                      {q.createdAt ? new Date(q.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      }) : "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusSelect id={q.id} current={q.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}
