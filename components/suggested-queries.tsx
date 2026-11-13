import { motion } from "framer-motion";
import { Button } from "./ui/button";

export const SuggestedQueries = ({
  handleSuggestionClick,
}: {
  handleSuggestionClick: (suggestion: string) => void;
}) => {
  const suggestionQueries = [
    {
      desktop: "What was our MRR last month?",
      mobile: "Last month MRR",
    },
    {
      desktop: "How many paying customers did we have at the end of each month this year?",
      mobile: "Paying customers",
    },
    {
      desktop: "How many new signups did we get each month this year?",
      mobile: "Monthly signups",
    },
    {
      desktop: "Which plans have the most active subscriptions?",
      mobile: "Top plans",
    },
    {
      desktop: "How much was refunded each month this year?",
      mobile: "Refunds by month",
    },
    {
      desktop: "What share of payments were refunded last month?",
      mobile: "Refund share",
    },
    {
      desktop: "How many web sessions did we get by source last month?",
      mobile: "Sessions by source",
    },
    {
      desktop: "Show total payments collected by month",
      mobile: "Payments by month",
    },
    {
      desktop: "Compare invoices and payments by month this year",
      mobile: "Invoices vs payments",
    },
  ];

  return (
    <motion.div
      key="suggestions"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      layout
      exit={{ opacity: 0 }}
      className="h-full overflow-y-auto"
    >
      <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-4">
        Try these queries:
      </h2>
      <div className="flex flex-wrap gap-2">
        {suggestionQueries.map((suggestion, index) => (
          <Button
            key={index}
            className={index > 5 ? "hidden sm:inline-block" : ""}
            type="button"
            variant="outline"
            onClick={() => handleSuggestionClick(suggestion.desktop)}
          >
            <span className="sm:hidden">{suggestion.mobile}</span>
            <span className="hidden sm:inline">{suggestion.desktop}</span>
          </Button>
        ))}
      </div>
    </motion.div>
  );
};