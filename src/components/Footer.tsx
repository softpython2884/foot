
export function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="bg-muted text-muted-foreground py-6 mt-auto">
      <div className="container mx-auto text-center px-4">
        <p>&copy; {currentYear} SportSphere. All rights reserved.</p>
        <p className="text-sm">Your ultimate guide to the world of sports.</p>
      </div>
    </footer>
  );
}
