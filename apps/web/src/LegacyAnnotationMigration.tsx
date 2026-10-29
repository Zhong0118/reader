import { useRef, useState } from "react";
import { api } from "@neoread/api";
import { Button } from "@neoread/ui/components/button";
import { LoaderCircle } from "lucide-react";

export function LegacyAnnotationMigration() {
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        disabled={busy}
        onClick={async () => {
          if (lock.current) return;
          lock.current = true;
          setBusy(true);
          setNotice("");
          try {
            const result = await api.migrateLegacyAnnotations();
            setNotice(
              `已迁移 ${result.migrated} 条旧版批注${result.skipped ? `，${result.skipped} 项暂未迁移，可在翻译完成后重试` : ""}${result.failed ? `，${result.failed} 个文档迁移失败，请查看诊断日志后重试` : ""}。`,
            );
          } catch {
            setNotice("旧版批注迁移未完成，请重试。已保存的批注会保留。");
          } finally {
            lock.current = false;
            setBusy(false);
          }
        }}
      >
        {busy && (
          <LoaderCircle className="animate-spin motion-reduce:animate-none" />
        )}
        {busy ? "迁移中…" : "旧版批注数据迁移"}
      </Button>
      <p className="text-xs leading-5 text-muted-foreground">
        手动迁移书籍和论文中的旧版批注。正常打开文档不会执行此操作。
      </p>
      {notice && (
        <p role="status" className="text-xs text-muted-foreground">
          {notice}
        </p>
      )}
    </div>
  );
}
