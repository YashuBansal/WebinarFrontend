import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Bold,
  Heading1,
  Heading2,
  Italic,
  Link2,
  List,
  ListOrdered,
  Palette,
  PencilLine,
  Redo2,
  RotateCcw,
  Unlink,
} from "lucide-react";
import {
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { EditorProvider, useCurrentEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextStyle from "@tiptap/extension-text-style";
import ListItem from "@tiptap/extension-list-item";
import Color from "@tiptap/extension-color";
import Link from "@tiptap/extension-link";

import "./tiptap.css"; // TipTap custom styles
import { Button as UiButton, buttonVariants } from "../../components/ui/button";
import { cn } from "../../lib/utils";
import {
  getNoticeBoard,
  updateNoticeBoard,
} from "../../features/actions/noticeBoard";
import { useDispatch, useSelector } from "react-redux";
import {
  clearNoticeBoardUpdated,
  resetSuccessAndUpdate,
} from "../../features/slices/noticeBoard";
import { useNavigate, useSearchParams } from "react-router-dom";
import useAddUserActivity from "../../hooks/useAddUserActivity";
import { useTheme } from "../../contexts/ThemeContext";
import HubSubpageShell from "../../components/Layout/HubSubpageShell";

const ToolbarDivider = () => (
  <div
    aria-hidden
    className="mx-1 hidden h-6 w-px bg-slate-200 sm:block dark:bg-slate-700"
  />
);

const ToolbarIconButton = ({
  title,
  active,
  disabled,
  onClick,
  children,
  className,
}) => {
  return (
    <button
      type="button"
      title={title}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        buttonVariants({ variant: "outline", size: "icon" }),
        "h-8 w-8 rounded-lg border-slate-200 bg-white text-slate-700 shadow-none transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-800/70",
        active &&
          "border-blue-500/40 bg-blue-50 text-blue-700 dark:border-blue-500/40 dark:bg-blue-950/40 dark:text-blue-200",
        disabled && "pointer-events-none opacity-40",
        className,
      )}
    >
      {children}
    </button>
  );
};

const MenuBar = () => {
  const { editor } = useCurrentEditor();
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  if (!editor) return null;

  const handleAddLink = () => {
    editor.chain().focus().setLink({ href: linkUrl }).run();
    setLinkDialogOpen(false);
    setLinkUrl("");
  };

  const colors = ["#ef4444", "#22c55e", "#3b82f6", "#f59e0b", "#a855f7"];

  return (
    <>
      <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50/80 p-2 dark:border-slate-700 dark:bg-slate-800/40">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <ToolbarIconButton
              title="Bold"
              active={editor.isActive("bold")}
              disabled={!editor.can().chain().focus().toggleBold().run()}
              onClick={() => editor.chain().focus().toggleBold().run()}
            >
              <Bold className="h-4 w-4" />
            </ToolbarIconButton>
            <ToolbarIconButton
              title="Italic"
              active={editor.isActive("italic")}
              disabled={!editor.can().chain().focus().toggleItalic().run()}
              onClick={() => editor.chain().focus().toggleItalic().run()}
            >
              <Italic className="h-4 w-4" />
            </ToolbarIconButton>
          </div>

          <ToolbarDivider />

          <div className="flex items-center gap-1.5">
            <ToolbarIconButton
              title="Heading 1"
              active={editor.isActive("heading", { level: 1 })}
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 1 }).run()
              }
            >
              <Heading1 className="h-4 w-4" />
            </ToolbarIconButton>
            <ToolbarIconButton
              title="Heading 2"
              active={editor.isActive("heading", { level: 2 })}
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
            >
              <Heading2 className="h-4 w-4" />
            </ToolbarIconButton>
          </div>

          <ToolbarDivider />

          <div className="flex items-center gap-1.5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-300">
              <Palette className="h-4 w-4" aria-hidden />
            </span>
            <div className="flex items-center gap-1">
              {colors.map((color) => {
                const active = editor.isActive("textStyle", { color });
                return (
                  <button
                    key={color}
                    type="button"
                    title={`Text color`}
                    aria-pressed={active}
                    onClick={() => editor.chain().focus().setColor(color).run()}
                    className={cn(
                      "h-6 w-6 rounded-full border transition ring-offset-2 ring-offset-slate-50 hover:scale-[1.04] focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:ring-offset-slate-900",
                      active
                        ? "ring-2 ring-blue-500/50"
                        : "border-slate-300/80 dark:border-slate-600",
                    )}
                    style={{ backgroundColor: color }}
                  />
                );
              })}
            </div>
          </div>

          <ToolbarDivider />

          <div className="flex items-center gap-1.5">
            <ToolbarIconButton
              title="Insert link"
              onClick={() => setLinkDialogOpen(true)}
            >
              <Link2 className="h-4 w-4" />
            </ToolbarIconButton>
            <ToolbarIconButton
              title="Remove link"
              onClick={() => editor.chain().focus().unsetLink().run()}
            >
              <Unlink className="h-4 w-4" />
            </ToolbarIconButton>
          </div>

          <ToolbarDivider />

          <div className="flex items-center gap-1.5">
            <ToolbarIconButton
              title="Undo"
              onClick={() => editor.chain().focus().undo().run()}
            >
              <RotateCcw className="h-4 w-4" />
            </ToolbarIconButton>
            <ToolbarIconButton
              title="Redo"
              onClick={() => editor.chain().focus().redo().run()}
            >
              <Redo2 className="h-4 w-4" />
            </ToolbarIconButton>
          </div>

          <ToolbarDivider />

          <div className="flex items-center gap-1.5">
            <ToolbarIconButton
              title="Bullet list"
              active={editor.isActive("bulletList")}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
            >
              <List className="h-4 w-4" />
            </ToolbarIconButton>
            <ToolbarIconButton
              title="Numbered list"
              active={editor.isActive("orderedList")}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
            >
              <ListOrdered className="h-4 w-4" />
            </ToolbarIconButton>
          </div>
        </div>
      </div>
      <Dialog open={linkDialogOpen} onClose={() => setLinkDialogOpen(false)}>
        <DialogTitle>Add a Hyperlink</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="URL"
            type="url"
            fullWidth
            variant="outlined"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLinkDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddLink} variant="contained" color="primary">
            Add Link
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

const extensions = [
  Color.configure({ types: [TextStyle.name, ListItem.name] }),
  TextStyle.configure({ types: [ListItem.name] }),
  StarterKit.configure({
    bulletList: {
      keepMarks: true,
    },
    orderedList: {
      keepMarks: true,
    },
  }),
  Link.configure({
    openOnClick: false, // Prevent opening links while editing
  }),
];

const emptyNoticeHtml = "<p></p>";

const cardClass =
  "rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800/90 sm:p-6";

const UpdateNoticeboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const logUserActivity = useAddUserActivity();

  const { noticeData, isSuccess, isLoading } = useSelector(
    (state) => state.noticeBoard,
  );

  const [editorContent, setEditorContent] = useState(
    noticeData?.content || emptyNoticeHtml,
  );
  const [searchParams, setSearchParams] = useSearchParams();
  const noticeType = useMemo(() => {
    const raw = (searchParams.get("type") || "reminder").toLowerCase();
    return raw === "sales" || raw === "reminder" ? raw : "reminder";
  }, [searchParams]);

  const handleNoticeTypeChange = useCallback(
    (next) => {
      if (next === noticeType) return;
      setSearchParams(
        (prev) => {
          const p = new URLSearchParams(prev);
          p.set("type", next);
          return p;
        },
        { replace: true },
      );
    },
    [noticeType, setSearchParams],
  );

  useEffect(() => {
    dispatch(clearNoticeBoardUpdated());
    dispatch(getNoticeBoard(noticeType));
  }, [dispatch, noticeType]);

  useEffect(() => {
    // Avoid showing the previous type's HTML while the next notice loads.
    setEditorContent(emptyNoticeHtml);
  }, [noticeType]);

  useEffect(() => {
    if (!noticeData) return;
    if (noticeData.type && noticeData.type !== noticeType) return;
    setEditorContent(noticeData.content || emptyNoticeHtml);
  }, [noticeData, noticeType]);

  useEffect(() => {
    if (isSuccess) {
      navigate("/notice-board");
    }
    return () => {
      dispatch(resetSuccessAndUpdate());
    };
  }, [isSuccess, navigate, dispatch]);

  const handleUpdateNotice = () => {
    dispatch(updateNoticeBoard({ content: editorContent, type: noticeType }));
    logUserActivity({
      action: "update",
      details: "User updated the noticeboard",
    });
  };

  return (
    <HubSubpageShell
      showBack={false}
      maxWidthClass="max-w-5xl"
      contentClassName="space-y-6 transition-all duration-300"
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <h2
          className="text-2xl font-bold tracking-tight"
          style={{ color: isDark ? "#f8fafc" : "#071028" }}
        >
          Update notice board
        </h2>
        <p
          className="mt-1 text-sm"
          style={{ color: isDark ? "#94a3b8" : "#64748b" }}
        >
          You&rsquo;re editing the{" "}
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {noticeType === "reminder" ? "Reminder" : "Sales"}
          </span>{" "}
          notice.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.35,
          delay: 0.08,
          ease: [0.22, 1, 0.36, 1],
        }}
        className={cardClass}
      >
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          <div className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Notice type
          </div>
          <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <button
              type="button"
              onClick={() => handleNoticeTypeChange("reminder")}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-semibold transition",
                noticeType === "reminder"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
              )}
            >
              Reminder
            </button>
            <button
              type="button"
              onClick={() => handleNoticeTypeChange("sales")}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-semibold transition",
                noticeType === "sales"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
              )}
            >
              Sales
            </button>
          </div>
        </div>
      </motion.div>

      <motion.section
        key={noticeType}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.35,
          delay: 0.08,
          ease: [0.22, 1, 0.36, 1],
        }}
        className={cardClass}
      >
        <div className="mb-5 flex items-center gap-2">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Notice editor
          </h2>
        </div>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50/50 p-3 dark:border-slate-700 dark:from-slate-900 dark:to-slate-950/40 sm:p-4">
          <EditorProvider
            key={noticeType}
            slotBefore={<MenuBar />}
            extensions={extensions}
            content={editorContent}
            onUpdate={({ editor }) => setEditorContent(editor.getHTML())}
          >
            <EditorContent className="notice-editor-content max-w-none px-1 py-1 focus:outline-none sm:px-2 sm:py-2" />
          </EditorProvider>
        </div>
        <div className="mt-5 flex justify-end">
          <UiButton
            type="button"
            onClick={handleUpdateNotice}
            disabled={isLoading}
            className="min-w-[140px] rounded-xl bg-wlh-brand px-5 text-white shadow-sm transition-transform hover:scale-[1.02] hover:bg-wlh-brand/90 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
          >
            <PencilLine className="h-4 w-4" />
            {isLoading ? "Updating..." : "Update notice"}
          </UiButton>
        </div>
      </motion.section>
    </HubSubpageShell>
  );
};

export default UpdateNoticeboard;
