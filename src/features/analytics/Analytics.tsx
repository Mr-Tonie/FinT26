import { Layout } from "@/shared/components/Layout";

export function Analytics() {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-neutral-900">Analytics</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Detailed financial reports and insights
          </p>
        </div>

        <div className="card text-center py-12">
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">
            Analytics Coming Soon
          </h3>
          <p className="text-neutral-600">
            Advanced charts and reports will be available here.
          </p>
        </div>
      </div>
    </Layout>
  );
}
