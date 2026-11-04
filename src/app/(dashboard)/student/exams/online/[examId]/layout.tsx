// This layout overrides the student dashboard layout for the online exam detail page.
// It intentionally renders only the page content, without sidebar, header, or footer.
// Keep this minimal to ensure the exam UI matches the provided full-screen design.

export default function OnlineExamRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
