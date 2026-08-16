import { Navigate, Route, Routes } from "react-router-dom";

import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Placeholder from "./pages/Placeholder";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<Placeholder title="Dashboard" />} />
          <Route path="billing" element={<Placeholder title="Billing" />} />
          <Route path="invoices" element={<Placeholder title="Invoices" />} />
          <Route
            path="invoices/:id"
            element={<Placeholder title="Invoice detail" />}
          />
          <Route path="customers" element={<Placeholder title="Customers" />} />
          <Route
            path="categories"
            element={<Placeholder title="Categories" />}
          />
          <Route path="products" element={<Placeholder title="Products" />} />
          <Route path="variants" element={<Placeholder title="Variants" />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
