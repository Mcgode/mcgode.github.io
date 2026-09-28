module PortfolioFilters
  # Sorts portfolio entries newest first. Ruby's sort is not stable, so
  # relying on `sort: 'date' | reverse` alone leaves ties (e.g. two entries
  # dated the same month) in an arbitrary order. Breaking ties in favor of
  # "major" entries keeps them from randomly landing behind a "minor" one
  # that shares the same date.
  def portfolio_sorted(portfolio)
    portfolio.sort_by do |project|
      importance_rank = project.data["importance"] == "major" ? 0 : 1
      [-project.date.to_i, importance_rank]
    end
  end
end

Liquid::Template.register_filter(PortfolioFilters)
